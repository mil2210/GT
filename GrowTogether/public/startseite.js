// Login-Check
const user = localStorage.getItem("gt_loggedin");
const token = localStorage.getItem("gt_token");

if (!user || !token) {
    window.location.href = "login.html";
}

// Global verfügbar machen (für onclick)
window.logout = async function logout() {
    const confirmed = await confirmLogout();
    if (confirmed) {
        localStorage.removeItem("gt_loggedin");
        localStorage.removeItem("gt_token");
        window.location.href = "login.html";
    }
};

// Zusätzlich: auch per Button-Click absichern (falls onclick mal nicht feuert)
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector('button[onclick="logout()"]');
    if (btn) {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            window.logout();
        });
    }
});
