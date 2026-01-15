cd Wie man das Projekt mit dem Server startet:

1. Projektordner öffnen
2.Terminal unten links öffnen oder oben links in der leiste neben Run "..." drücken und auf new Terminal
ACHTUNG: Im richtigen Ordner befinden also cd GrowTogether und nochmal cd GrowTogether
3.Projekt starten mit: docker-compose up -d --build
4. fertig




LÖSCHEN aller User und Daten aus der Datenbank:
docker-compose down -v


EINFACH Datenbank AUSSCHALTEN
docker-compose down


Falls im Code etwas geändert wird, während der Server läuft:
docker compose up --build -d

AUSSCHALTEN:
Strg + C