async function login() {
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");
    
    // Reset message
    errorMsg.style.display = 'none';

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();

        if (data.success) {
            // Redirection selon rôle
            if (data.role === 'admin') window.location.href = 'complexe.html';
            else window.location.href = 'stats.html';
        } else {
            errorMsg.style.display = 'block';
            errorMsg.innerText = data.error;
        }
    } catch (e) {
        errorMsg.style.display = 'block';
        errorMsg.innerText = "Erreur serveur.";
    }
}