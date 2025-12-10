async function login() {
    console.log("Tentative de connexion...");
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");
    
    if(errorMsg) errorMsg.style.display = 'none';

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();

        if (data.success) {
            console.log("Rôle reçu du serveur :", data.role);
            
            // Stockage temporaire du nom pour l'affichage profil
            sessionStorage.setItem('username', u);

            // Redirection STRICTE
            if (data.role === 'admin') {
                console.log("Redirection -> Complexe");
                window.location.href = 'complexe.html';
            } else {
                console.log("Redirection -> Stats");
                window.location.href = 'stats.html';
            }
        } else {
            if(errorMsg) {
                errorMsg.style.display = 'block';
                errorMsg.innerText = data.error;
            }
        }
    } catch (e) {
        console.error("Erreur JS:", e);
        if(errorMsg) {
            errorMsg.style.display = 'block';
            errorMsg.innerText = "Erreur de communication avec le serveur.";
        }
    }
}