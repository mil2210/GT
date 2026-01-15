async function registerUser() {
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("pass").value;

    if (!username || !email || !pass) {
        alert("Bitte alle Felder ausfüllen!");
        return;
    }

    const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password: pass })
    });

    if (r.status === 409) {
        alert("Diese E-Mail ist bereits registriert!");
        return;
    }

    if (!r.ok) {
        // zeigt dir die echte Fehlermeldung vom Server
        const txt = await r.text().catch(() => "");
        alert("Registrierung fehlgeschlagen!\n" + txt);
        return;
    }

    alert("Registrierung erfolgreich!");
    window.location.href = "login.html";
}
