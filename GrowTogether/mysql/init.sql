create database if not exists growtogether;
use growtogether;

CREATE TABLE IF NOT EXISTS facts (
	id INT AUTO_INCREMENT PRIMARY KEY,
    description  VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password CHAR(64) NOT NULL, -- SHA-256 Hash
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mother_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(150),
    birth_date DATE,
    address VARCHAR(255),
    contact VARCHAR(100),
    insurance_number VARCHAR(50),
    blood_group VARCHAR(10),
    preconditions TEXT,
    allergies TEXT,
    medications TEXT,
    previous_pregnancies TEXT,
    profession TEXT,
    risks TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS child_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(150),
    birth_date DATE,
    birth_time TIME,
    birth_place VARCHAR(150),
    weight INT,
    height INT,
    head_circumference INT,
    apgar TEXT,
    blood_group VARCHAR(10),
    screening TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS father_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(150),
    birth_date DATE,
    address VARCHAR(255),
    contact VARCHAR(100),
    profession TEXT,
    allergies TEXT,
    medications TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS calender (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_date DATE NOT NULL,
    title VARCHAR(150),
    time VARCHAR(10),
    note TEXT,
    tag VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(255) NOT NULL,   -- Pfad auf dem Server
    filesize INT,                     -- Größe in Bytes
    file_data LONGBLOB,               -- Base64-kodierter Dateiinhalt
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO facts (id, description) values
(1, 'Schlaf in der Schwangerschaft: Versuche, möglichst auf der linken Seite zu schlafen. Das verbessert die Durchblutung der Plazenta und kann Schwindel vorbeugen. Wenn dir das schwer fällt, nutze ein Stillkissen zur Unterstützung.'),
(2, 'Ausreichend trinken: In der Schwangerschaft steigt dein Flüssigkeitsbedarf deutlich. Achte auf 1,5–2 Liter Wasser täglich. Das hilft gegen Müdigkeit, Kreislaufprobleme und unterstützt die Fruchtwasserbildung.'),
(3, 'Nährstoffreiche Ernährung: Setze auf eisenhaltige Lebensmittel wie Spinat, Linsen und Vollkornprodukte, kombiniert mit Vitamin C (z.B. Paprika oder Orangen), damit dein Körper Eisen besser aufnehmen kann.'),
(4, 'Leichte Bewegung: 20–30 Minuten Spaziergang oder leichte Schwangerschaftsgymnastik pro Tag können Rückenschmerzen, Wassereinlagerungen und Stress reduzieren — und verbessern die Schlafqualität.'),
(5, 'Stress reduzieren: Dein Körper arbeitet auf Hochtouren — kurze Pausen, Atemübungen oder Meditation helfen, innere Ruhe zu finden. Stresshormone wirken sich auch auf das Baby aus, daher gönn dir bewusst Ruhe.'),
(6, 'Abendroutine: Vermeide schweres Essen kurz vor dem Schlafengehen. Ein warmes Bad oder eine Tasse Kräutertee (z. B. Rooibos) entspannt und fördert besseren Schlaf.'),
(7, 'Rückenschmerzen vorbeugen: Achte beim Sitzen darauf, dass deine Knie nicht höher als die Hüfte sind. Lege außerdem zwischendurch die Beine hoch — das entlastet den unteren Rücken.'),
(8, 'Regelmäßig essen: Kleine, häufige Mahlzeiten helfen gegen Übelkeit und halten den Blutzuckerspiegel stabil. Mandeln, Bananen oder Haferflocken sind ideale Snacks.'),
(9, 'Beckenbodentraining: Beginne schon in der Schwangerschaft mit leichten Übungen. Ein starker Beckenboden erleichtert die Geburt und hilft bei der Rückbildung.'),
(10, 'Digital Detox:* Reduziere abends die Bildschirmzeit. Blaues Licht kann den Schlaf-Wach-Rhythmus stören. Lies stattdessen ein Buch oder höre entspannende Musik.');


