const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

// Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'mon_secret_super_securise',
    resave: false,
    saveUninitialized: true
}));

// Connexion Base de données (Attente que MySQL soit prêt)
const dbConfig = {
    host: 'db', // Nom du service dans docker-compose
    user: 'root',
    password: 'rootpassword',
    database: 'projet_web'
};

let db;
function handleDisconnect() {
    db = mysql.createConnection(dbConfig);
    db.connect(err => {
        if (err) {
            console.log('Erreur connexion DB, nouvel essai dans 2s...', err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('Connecté à MySQL !');
            seedDatabase(); // Initialiser les users proprement
        }
    });
}
handleDisconnect();

// Fonction pour insérer les users de test s'ils n'existent pas (pour être sûr des hashs)
async function seedDatabase() {
    const usersToCreate = [
        { u: 'admin1', p: 'mdpa1', r: 'admin' },
        { u: 'admin2', p: 'mdpa2', r: 'admin' },
        { u: 'admin3', p: 'mdpa3', r: 'admin' },
        { u: 'user1', p: 'mdpu1', r: 'user' },
        { u: 'user2', p: 'mdpu2', r: 'user' },
        { u: 'user3', p: 'mdpu3', r: 'user' }
    ];

    for (const u of usersToCreate) {
        const hash = await bcrypt.hash(u.p, 10);
        // On utilise INSERT IGNORE pour ne pas planter si l'user existe déjà
        db.query(`INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, 
            [u.u, hash, u.r]);
    }
    console.log("Base de données initialisée avec les comptes de test.");
}

// --- ROUTES API ---

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ error: "Erreur serveur" });
        if (results.length === 0) return res.status(401).json({ error: "Utilisateur inconnu" });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            req.session.user = { id: user.id, username: user.username, role: user.role };
            res.json({ success: true, role: user.role });
        } else {
            res.status(401).json({ error: "Mot de passe incorrect" });
        }
    });
});

// Logout
app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/accueil.html');
});

// Vérification de session (pour le frontend)
app.get('/api/session', (req, res) => {
    if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
    else res.json({ loggedIn: false });
});

// --- GESTION DES PAGES ET DROITS ---

// Middleware de protection
function checkAuth(req, res, next) {
    if (!req.session.user) return res.redirect('/accueil.html');
    next();
}

function checkAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') next();
    else res.status(403).send("Accès interdit : Réservé aux administrateurs.");
}

// Servir les fichiers statiques (CSS, JS, CSV) depuis le dossier public
app.use(express.static('public', { index: false })); 
// Note: on met index: false pour gérer manuellement les routes HTML ci-dessous

// Routes HTML spécifiques avec protection
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/accueil.html')));
app.get('/accueil.html', (req, res) => res.sendFile(path.join(__dirname, 'public/accueil.html')));

// Projet.html (Accessible Visiteurs, Users, Admins) -> Pas de protection stricte demandée pour visiteur
app.get('/projet.html', (req, res) => res.sendFile(path.join(__dirname, 'public/projet.html')));

// Stats.html (Accessible Users et Admins)
app.get('/stats.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public/stats.html')));

// Complexe.html (Accessible ADMIN seulement)
app.get('/complexe.html', checkAuth, checkAdmin, (req, res) => res.sendFile(path.join(__dirname, 'public/complexe.html')));

// Lancement
app.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});