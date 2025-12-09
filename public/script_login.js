// Fichier : public/script_login.js

async function login() {
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");

    // Réinitialiser le message d'erreur
    errorMsg.style.display = 'none';

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        
        const data = await res.json();
        
        if (data.success) {
            // Redirection selon le rôle
            if (data.role === 'admin') {
                window.location.href = 'complexe.html';
            } else {
                window.location.href = 'stats.html';
            }
        } else {
            // Affichage de l'erreur
            errorMsg.style.display = 'block';
            errorMsg.innerText = data.error || "Erreur de connexion";
        }
    } catch (err) {
        console.error(err);
        errorMsg.style.display = 'block';
        errorMsg.innerText = "Erreur de communication avec le serveur";
    }
}

// Optionnel : Permettre de valider avec la touche "Entrée"
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('#username, #password');
    inputs.forEach(input => {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    });
});