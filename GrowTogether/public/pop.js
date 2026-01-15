document.addEventListener("DOMContentLoaded", function () {

    // Ausführliche, hilfreiche Tipps
    const facts = [
        "🍃 *Schlaf in der Schwangerschaft:* Versuche, möglichst auf der linken Seite zu schlafen. Das verbessert die Durchblutung der Plazenta und kann Schwindel vorbeugen. Wenn dir das schwer fällt, nutze ein Stillkissen zur Unterstützung.",
        
        "💧 *Ausreichend trinken:* In der Schwangerschaft steigt dein Flüssigkeitsbedarf deutlich. Achte auf 1,5–2 Liter Wasser täglich. Das hilft gegen Müdigkeit, Kreislaufprobleme und unterstützt die Fruchtwasserbildung.",
        
        "🥦 *Nährstoffreiche Ernährung:* Setze auf eisenhaltige Lebensmittel wie Spinat, Linsen und Vollkornprodukte, kombiniert mit Vitamin C (z.B. Paprika oder Orangen), damit dein Körper Eisen besser aufnehmen kann.",
        
        "🚶 *Leichte Bewegung:* 20–30 Minuten Spaziergang oder leichte Schwangerschaftsgymnastik pro Tag können Rückenschmerzen, Wassereinlagerungen und Stress reduzieren — und verbessern die Schlafqualität.",
        
        "🧘 *Stress reduzieren:* Dein Körper arbeitet auf Hochtouren — kurze Pausen, Atemübungen oder Meditation helfen, innere Ruhe zu finden. Stresshormone wirken sich auch auf das Baby aus, daher gönn dir bewusst Ruhe.",
        
        "🌙 *Abendroutine:* Vermeide schweres Essen kurz vor dem Schlafengehen. Ein warmes Bad oder eine Tasse Kräutertee (z. B. Rooibos) entspannt und fördert besseren Schlaf.",
        
        "🍼 *Rückenschmerzen vorbeugen:* Achte beim Sitzen darauf, dass deine Knie nicht höher als die Hüfte sind. Lege außerdem zwischendurch die Beine hoch — das entlastet den unteren Rücken.",
        
        "🤰 *Regelmäßig essen:* Kleine, häufige Mahlzeiten helfen gegen Übelkeit und halten den Blutzuckerspiegel stabil. Mandeln, Bananen oder Haferflocken sind ideale Snacks.",
        
        "💪 *Beckenbodentraining:* Beginne schon in der Schwangerschaft mit leichten Übungen. Ein starker Beckenboden erleichtert die Geburt und hilft bei der Rückbildung.",
        
        "📱 *Digital Detox:* Reduziere abends die Bildschirmzeit. Blaues Licht kann den Schlaf-Wach-Rhythmus stören. Lies stattdessen ein Buch oder höre entspannende Musik.",
    ];

    // Ein Tipp soll 24 Stunden gleich bleiben
    const today = new Date().toISOString().slice(0, 10);

    // Prüfen, ob ein Tipp gespeichert ist
    let savedDate = localStorage.getItem("dailyTipDate");
    let savedTip = localStorage.getItem("dailyTip");

    // Wenn noch kein Tipp für heute vorhanden ist → Tipp generieren
    if (savedDate !== today) {
        const newFact = facts[Math.floor(Math.random() * facts.length)];
        localStorage.setItem("dailyTip", newFact);
        localStorage.setItem("dailyTipDate", today);
        savedTip = newFact;
    }

    // Popup-Elemente
    const overlay = document.getElementById("popup-overlay");
    const popup = document.getElementById("popup-box");
    const closeBtn = document.getElementById("popup-close");
    const textBox = document.getElementById("popup-text");

    // Wenn Elemente nicht existieren (z.B. auf anderen Seiten), beenden
    if (!overlay || !popup || !closeBtn || !textBox) return;

    // Tipp einfügen (Markdown-Style text formatieren)
    textBox.innerHTML = savedTip
        .replace(/\\(.?)\\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    // Popup anzeigen
    overlay.style.display = "block";
    popup.style.display = "block";

    // Schließen per Button
    closeBtn.addEventListener("click", function () {
        overlay.style.display = "none";
        popup.style.display = "none";
    });

    // Schließen per Klick auf Overlay
    overlay.addEventListener("click", function (e) {
        if (e.target === overlay) {
            overlay.style.display = "none";
            popup.style.display = "none";
        }
    });

    // Schließen per ESC-Taste
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && popup.style.display === "block") {
            overlay.style.display = "none";
            popup.style.display = "none";
        }
    });
});