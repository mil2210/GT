async function registerUser() {
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("pass").value;

    if (!username || !email || !pass) {
        notifyWarning("Bitte alle Felder ausfüllen!");
        return;
    }

    const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password: pass })
    });

    if (r.status === 409) {
        notifyError("Diese E-Mail ist bereits registriert!");
        return;
    }

    if (!r.ok) {
        notifyError("Registrierung fehlgeschlagen!");
        return;
    }

    notifySuccess("Registrierung erfolgreich!");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);
}
