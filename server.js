const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

// On configure le serveur pour qu'il comprenne les données JSON et les formulaires
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// On dit au serveur de servir les fichiers du dossier "public" (css, js, csv...)
// On met index: false pour pas qu'il charge automatiquement les html sans qu'on contrôle
app.use(express.static('public', { index: false })); 

// Configuration de la session pour garder l'utilisateur connecté
app.use(session({
    secret: 'secret_key_projet_iut', // Clé secrète pour crypter la session
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // false parce qu'on est en local (http), pas en https
}));

// Infos de connexion à la base de données (ça vient du docker-compose)
const dbConfig = {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'rootpassword',
    database: process.env.DB_NAME || 'projet_web'
};

let db;

// Fonction pour se connecter à la BDD
// On a mis un systeme de "retry" : si MySQL n'est pas encore prêt (ça arrive avec Docker),
// on attend 3 secondes et on réessaie au lieu de faire planter le serveur.
function connectToDB() {
    db = mysql.createConnection(dbConfig);
    db.connect(err => {
        if (err) {
            console.error('Erreur connexion DB, on réessaie dans 3s...', err.message);
            setTimeout(connectToDB, 3000);
        } else {
            console.log('C\'est bon, connecté à MySQL !');
            seedUsers(); // On lance la création des comptes par défaut
        }
    });
}
connectToDB();

// Cette fonction sert à créer les comptes de test automatiquement au démarrage
// Comme ça on n'a pas besoin de les insérer à la main dans PHPMyAdmin
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
        // On vérifie si l'utilisateur existe déjà pour pas faire de doublons
        db.query('SELECT * FROM users WHERE username = ?', [user.u], async (err, res) => {
            if (res && res.length === 0) {
                // IMPORTANT : On hache le mot de passe avant de le stocker pour la sécurité
                const hash = await bcrypt.hash(user.p, 10);
                db.query('INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, ?)', [user.u, hash, user.r]);
                console.log(`Compte de test créé : ${user.u}`);
            }
        });
    }
}

// --- FONCTIONS DE SÉCURITÉ (MIDDLEWARES) ---

// Vérifie si le gars est connecté, sinon on le renvoie à l'accueil
function checkAuth(req, res, next) {
    if (req.session.user) next();
    else res.redirect('/accueil.html');
}

// Vérifie si c'est un ADMIN. Si c'est juste un user, on lui interdit l'accès.
function checkAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') next();
    else res.status(403).send("<h1>Stop !</h1><p>Cette page est réservée aux admins.</p><a href='/accueil.html'>Retour</a>");
}

// --- ROUTES (API) ---

// Route pour gérer la connexion (Login)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // On cherche l'utilisateur dans la BDD
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ success: false, error: 'Compte inconnu' });
        
        const user = results[0];
        // On compare le mot de passe donné avec le hash stocké dans la BDD
        const match = await bcrypt.compare(password, user.password);
        
        if (match) {
            // C'est le bon mdp, on remplit la session
            req.session.user = { id: user.id, username: user.username, role: user.role };
            res.json({ success: true, role: user.role });
        } else {
            res.status(401).json({ success: false, error: 'Mauvais mot de passe' });
        }
    });
});

// Route pour savoir qui est connecté (utilisé par le Javascript du frontend)
app.get('/api/session', (req, res) => {
    if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
    else res.json({ loggedIn: false });
});

// Route pour se déconnecter
app.get('/api/logout', (req, res) => {
    req.session.destroy(); // On supprime la session
    res.redirect('/accueil.html');
});

// --- GESTION DES PAGES ---
// C'est ici qu'on définit qui a le droit de voir quelle page

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/accueil.html')));
app.get('/accueil.html', (req, res) => res.sendFile(path.join(__dirname, 'public/accueil.html')));

// Projet.html est public (accessible aux visiteurs)
app.get('/projet.html', (req, res) => res.sendFile(path.join(__dirname, 'public/projet.html')));

// Stats.html : Il faut être connecté (User ou Admin)
app.get('/stats.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'public/stats.html')));

// Complexe.html : Il faut être Admin obligatoirement
app.get('/complexe.html', checkAuth, checkAdmin, (req, res) => res.sendFile(path.join(__dirname, 'public/complexe.html')));

// On lance le serveur sur le port 3000
app.listen(3000, () => console.log('Le serveur tourne sur le port 3000 !'));