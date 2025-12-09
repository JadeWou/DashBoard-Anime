const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

// --- CONFIGURATION ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public', { index: false })); // Sert les fichiers statiques (CSS, JS)
app.use(session({
    secret: 'secret_key_projet_iut',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // false car pas de HTTPS en local
}));

// --- BASE DE DONNÉES ---
const dbConfig = {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'rootpassword',
    database: process.env.DB_NAME || 'projet_web'
};

let db;

function connectToDB() {
    db = mysql.createConnection(dbConfig);
    db.connect(err => {
        if (err) {
            console.error('Erreur connexion DB (nouvel essai dans 3s):', err.message);
            setTimeout(connectToDB, 3000);
        } else {
            console.log('Connecté à MySQL.');
            seedUsers();
        }
    });
}
connectToDB();

// Création automatique des comptes demandés
async function seedUsers() {
    const users = [
        { u: 'admin1', p: 'mdpa1', r: 'admin' },
        { u: 'admin2', p: 'mdpa2', r: 'admin' },
        { u: 'admin3', p: 'mdpa3', r: 'admin' },
        { u: 'user1', p: 'mdpu1', r: 'user' },
        { u: 'user2', p: 'mdpu2', r: 'user' },
        { u: 'user3', p: 'mdpu3', r: 'user' }
    ];

    for (const user of users) {
        db.query('SELECT * FROM users WHERE username = ?', [user.u], async (err, res) => {
            if (res && res.length === 0) {
                const hash = await bcrypt.hash(user.p, 10);
                db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [user.u, hash, user.r]);
                console.log(`Compte créé : ${user.u}`);
            }
        });
    }
}

// --- MIDDLEWARES D'AUTH ---
function checkAuth(req, res, next) {
    if (req.session.user) next();
    else res.redirect('/accueil.html');
}

function checkAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') next();
    else res.status(403).send("<h1>403 Interdit</h1><p>Accès réservé aux administrateurs.</p><a href='/accueil.html'>Retour</a>");
}

// --- ROUTES API ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ success: false, error: 'Identifiant inconnu' });
        
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        
        if (match) {
            req.session.user = { id: user.id, username: user.username, role: user.role };
            res.json({ success: true, role: user.role });
        } else {
            res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
        }
    });
});

app.get('/api/session', (req, res) => {
    if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
    else res.json({ loggedIn: false });
});

app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/accueil.html');
});

// --- ROUTES PAGES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/accueil.html')));
app.get('/accueil.html', (req, res) => res.sendFile(path.join(__dirname, 'public/accueil.html')));
app.get('/projet.html', (req, res) => res.sendFile(path.join(__dirname, 'public/projet.html'))); // Accessible à tous
app.get('/stats.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public/stats.html'))); // Users & Admins
app.get('/complexe.html', checkAuth, checkAdmin, (req, res) => res.sendFile(path.join(__dirname, 'public/complexe.html'))); // Admins only

app.listen(3000, () => console.log('Serveur lancé sur port 3000'));