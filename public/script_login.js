async function login() {
    // On récupère ce que l'utilisateur a tapé
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");
    
    // On cache le message d'erreur au début
    errorMsg.style.display = 'none';

    try {
        // On envoie les données au serveur (server.js)
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();

        if (data.success) {
            // Si c'est bon, on redirige selon le rôle
            if (data.role === 'admin') window.location.href = 'complexe.html';
            else window.location.href = 'stats.html';
        } else {
            // Sinon on affiche l'erreur
            errorMsg.style.display = 'block';
            errorMsg.innerText = data.error;
        }
    } catch (e) {
        errorMsg.style.display = 'block';
        errorMsg.innerText = "Problème de connexion avec le serveur.";
    }
}