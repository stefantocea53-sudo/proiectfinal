let lastValidScanTime = 0;
let accessWindowSeconds = 5;

let doorOpen = false;
let alarmActive = false;
let nightMode = false;
let systemBlocked = false;

let validCount = 0;
let invalidCount = 0;
let outsideCount = 0;
let alarmCount = 0;
let wrongAttempts = 0;

let autoCloseTimer = null;
let blockTimer = null;

let logsText = [];

function getTime() {
    let now = new Date();

    let h = now.getHours().toString().padStart(2, "0");
    let m = now.getMinutes().toString().padStart(2, "0");
    let s = now.getSeconds().toString().padStart(2, "0");

    return h + ":" + m + ":" + s;
}

function showSection(sectionId, button) {
    let sections = document.querySelectorAll(".page-section");

    sections.forEach(function(section) {
        section.classList.remove("active-section");
    });

    let selectedSection = document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.add("active-section");
    }

    let buttons = document.querySelectorAll(".menu-btn");

    buttons.forEach(function(btn) {
        btn.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }
}

document.addEventListener("DOMContentLoaded", function() {
    let menuButtons = document.querySelectorAll(".menu-btn");

    menuButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            let sectionId = button.getAttribute("data-section");
            showSection(sectionId, button);
        });
    });
});

function updateStats() {
    document.getElementById("validCount").innerText = validCount;
    document.getElementById("invalidCount").innerText = invalidCount;
    document.getElementById("outsideCount").innerText = outsideCount;
    document.getElementById("alarmCount").innerText = alarmCount;
    document.getElementById("wrongCount").innerText = wrongAttempts;
    document.getElementById("lockStatus").innerText = systemBlocked ? "DA" : "NU";
}

function setLastAction(actionText) {
    document.getElementById("lastAction").innerText = actionText;
    document.getElementById("lastActionTime").innerText = "Ultima actualizare: " + getTime();
}

function addLog(source, event, status) {
    let table = document.getElementById("logTable");
    let row = document.createElement("tr");

    let statusClass = "status-info";

    if (status === "Permis") {
        statusClass = "status-ok";
    } else if (status === "Respins") {
        statusClass = "status-warning";
    } else if (status === "Alarmă") {
        statusClass = "status-danger";
    } else if (status === "Info") {
        statusClass = "status-info";
    }

    row.innerHTML = `
        <td>${getTime()}</td>
        <td>${source}</td>
        <td>${event}</td>
        <td class="${statusClass}">${status}</td>
    `;

    table.prepend(row);

    logsText.push("[" + getTime() + "] " + source + " - " + event + " - " + status);
    setLastAction(event);
}

function updateDoorArea(message, append = true) {
    let area = document.getElementById("doorArea");

    if (append === true) {
        area.value = "[" + getTime() + "] " + message + "\n" + area.value;
    } else {
        area.value = message;
    }
}

function setSecurityLevel(level, description) {
    let securityCard = document.querySelector(".security-card");
    let securityLevel = document.getElementById("securityLevel");
    let securityDescription = document.getElementById("securityDescription");

    securityLevel.innerText = level;
    securityDescription.innerText = description;

    securityCard.classList.remove("ridicat");
    securityCard.classList.remove("critic");

    if (level === "RIDICAT") {
        securityCard.classList.add("ridicat");
    }

    if (level === "CRITIC") {
        securityCard.classList.add("critic");
    }
}

function setBuzzer(active) {
    if (active === true) {
        document.getElementById("buzzerText").innerText = "ACTIV";
        document.getElementById("buzzerLight").className = "buzzer-light active";
        document.getElementById("buzzerDescription").innerText = "Buzzerul semnalizează o alertă.";
    } else {
        document.getElementById("buzzerText").innerText = "OPRIT";
        document.getElementById("buzzerLight").className = "buzzer-light off";
        document.getElementById("buzzerDescription").innerText = "Buzzerul este dezactivat.";
    }
}

function updateZoneDiagram(zone) {
    document.getElementById("zoneOutside").className = "zone-box";
    document.getElementById("zoneDoor").className = "zone-box zone-door";
    document.getElementById("zoneInside").className = "zone-box";

    if (zone === "outside") {
        document.getElementById("zoneOutside").className = "zone-box zone-active";
    }

    if (zone === "door-open") {
        document.getElementById("zoneDoor").className = "zone-box zone-door zone-open";
    }

    if (zone === "inside") {
        document.getElementById("zoneInside").className = "zone-box zone-active";
    }

    if (zone === "alert") {
        document.getElementById("zoneInside").className = "zone-box zone-alert";
        document.getElementById("zoneDoor").className = "zone-box zone-door zone-alert";
    }
}

function openDoor() {
    if (alarmActive === true || systemBlocked === true) {
        updateDoorArea("Ușa nu poate fi deschisă deoarece sistemul este în alarmă sau blocat.");
        return;
    }

    doorOpen = true;

    document.getElementById("doorText").innerText = "Ușă deschisă";
    document.getElementById("doorIcon").innerText = "🔓";
    document.getElementById("doorIcon").className = "door-icon unlocked";

    document.getElementById("servoText").innerText = "Deschisă";
    document.getElementById("servoLight").className = "light green-light";

    document.getElementById("zoneDoorText").innerText = "Deschisă";

    updateZoneDiagram("door-open");
    updateDoorArea("Ușă deschisă.");
}

function closeDoor() {
    doorOpen = false;

    document.getElementById("doorText").innerText = "Ușă blocată";
    document.getElementById("doorIcon").innerText = "🔒";
    document.getElementById("doorIcon").className = "door-icon locked";

    document.getElementById("servoText").innerText = "Închisă";
    document.getElementById("servoLight").className = "light red-light";

    document.getElementById("zoneDoorText").innerText = "Blocată";

    updateZoneDiagram("");
    updateDoorArea("Ușă închisă.");
}

function scanValidCard() {
    if (systemBlocked === true) {
        addLog("RFID", "Scanare refuzată deoarece sistemul este blocat temporar", "Respins");
        updateDoorArea("Sistem blocat temporar. Cardul nu poate fi scanat acum.");
        return;
    }

    if (alarmActive === true) {
        addLog("RFID", "Card valid detectat, dar alarma este activă", "Respins");
        updateDoorArea("Card valid detectat, dar alarma trebuie dezactivată înainte de acces.");
        return;
    }

    lastValidScanTime = Date.now();
    validCount++;
    wrongAttempts = 0;

    document.getElementById("lastCard").innerText = "29 CA 28 12";
    document.getElementById("lastUser").innerText = "Utilizator: Administrator";
    document.getElementById("accessMessage").innerText = "Card autorizat. Ușa este deschisă timp de 5 secunde.";

    openDoor();

    addLog("RFID", "Card autorizat scanat - Administrator", "Permis");
    updateDoorArea("Card valid detectat. Acces permis timp de 5 secunde.");
    updateStats();

    if (autoCloseTimer !== null) {
        clearTimeout(autoCloseTimer);
    }

    autoCloseTimer = setTimeout(function () {
        if (doorOpen === true) {
            closeDoor();

            document.getElementById("accessMessage").innerText = "Fereastra de acces a expirat. Ușa este blocată.";

            addLog("Ușă", "Ușa s-a închis automat după 5 secunde", "Info");
            updateDoorArea("Cele 5 secunde au expirat. Ușa s-a închis automat.");
        }
    }, 5000);
}

function scanSecondValidCard() {
    if (systemBlocked === true) {
        addLog("RFID", "Scanare refuzată deoarece sistemul este blocat temporar", "Respins");
        updateDoorArea("Sistem blocat temporar. Cardul nu poate fi scanat acum.");
        return;
    }

    if (alarmActive === true) {
        addLog("RFID", "Card valid detectat, dar alarma este activă", "Respins");
        updateDoorArea("Card valid detectat, dar alarma trebuie dezactivată înainte de acces.");
        return;
    }

    lastValidScanTime = Date.now();
    validCount++;
    wrongAttempts = 0;

    document.getElementById("lastCard").innerText = "53 7F 21 C9";
    document.getElementById("lastUser").innerText = "Utilizator: Student";
    document.getElementById("accessMessage").innerText = "Card autorizat. Ușa este deschisă timp de 5 secunde.";

    openDoor();

    addLog("RFID", "Card autorizat scanat - Student", "Permis");
    updateDoorArea("Card valid detectat. Acces permis timp de 5 secunde.");
    updateStats();

    if (autoCloseTimer !== null) {
        clearTimeout(autoCloseTimer);
    }

    autoCloseTimer = setTimeout(function () {
        if (doorOpen === true) {
            closeDoor();

            document.getElementById("accessMessage").innerText = "Fereastra de acces a expirat. Ușa este blocată.";

            addLog("Ușă", "Ușa s-a închis automat după 5 secunde", "Info");
            updateDoorArea("Cele 5 secunde au expirat. Ușa s-a închis automat.");
        }
    }, 5000);
}

function scanInvalidCard() {
    if (systemBlocked === true) {
        addLog("RFID", "Scanare ignorată - sistem blocat temporar", "Respins");
        updateDoorArea("Sistemul este blocat temporar. Așteaptă deblocarea.");
        return;
    }

    invalidCount++;
    wrongAttempts++;

    document.getElementById("lastCard").innerText = "91 B3 44 A2";
    document.getElementById("lastUser").innerText = "Utilizator: necunoscut";
    document.getElementById("accessMessage").innerText = "Card respins. Acces interzis.";

    closeDoor();

    addLog("RFID", "Card necunoscut scanat", "Respins");
    updateDoorArea("Card invalid detectat. Ușa rămâne închisă.");
    updateStats();

    if (wrongAttempts >= 3) {
        blockSystem();
    }
}

function blockSystem() {
    systemBlocked = true;

    document.getElementById("systemStatusText").innerText = "Sistem blocat";
    document.getElementById("systemDot").className = "status-dot offline";
    document.getElementById("accessMessage").innerText = "Sistem blocat temporar după 3 carduri greșite.";

    setSecurityLevel("CRITIC", "Sistem blocat temporar după mai multe carduri respinse.");
    setBuzzer(true);

    addLog("Sistem", "Blocare temporară după 3 carduri respinse consecutiv", "Alarmă");
    updateDoorArea("Sistem blocat temporar timp de 10 secunde.");
    updateStats();

    blockTimer = setTimeout(function () {
        systemBlocked = false;
        wrongAttempts = 0;

        document.getElementById("systemStatusText").innerText = "Sistem activ";
        document.getElementById("systemDot").className = "status-dot online";
        document.getElementById("accessMessage").innerText = "Sistem deblocat. Așteptare scanare card RFID.";

        if (alarmActive === false) {
            setBuzzer(false);

            if (nightMode === true) {
                setSecurityLevel("RIDICAT", "Mod noapte activ. Monitorizarea este mai strictă.");
            } else {
                setSecurityLevel("NORMAL", "Sistemul funcționează fără alerte.");
            }
        }

        addLog("Sistem", "Sistem deblocat automat după 10 secunde", "Info");
        updateDoorArea("Sistem deblocat automat.");
        updateStats();
    }, 10000);
}

function detectOutsideMotion() {
    outsideCount++;

    document.getElementById("outsideLight").className = "light orange-light";
    document.getElementById("outsideText").innerText = "Mișcare detectată în fața ușii.";

    updateZoneDiagram("outside");

    addLog("PIR exterior", "Persoană detectată în fața ușii", "Info");
    updateDoorArea("Mișcare detectată în exterior, în fața ușii.");
    updateStats();

    setTimeout(function () {
        document.getElementById("outsideLight").className = "light off";
        document.getElementById("outsideText").innerText = "Nu este detectată mișcare în exterior.";

        if (doorOpen === true) {
            updateZoneDiagram("door-open");
        } else {
            updateZoneDiagram("");
        }
    }, 3000);
}

function detectInsideMotion() {
    document.getElementById("insideLight").className = "light orange-light";
    document.getElementById("insideText").innerText = "Mișcare detectată pe hol.";

    updateZoneDiagram("inside");

    let now = Date.now();
    let differenceSeconds = (now - lastValidScanTime) / 1000;

    if (doorOpen === true && differenceSeconds <= accessWindowSeconds) {
        addLog("PIR interior", "Mișcare pe hol permisă în timpul ferestrei de acces", "Permis");
        updateDoorArea("Mișcare pe hol permisă. Ușa este deschisă și cardul valid a fost scanat în ultimele 5 secunde.");
    } else {
        activateAlarm("Mișcare pe hol detectată după expirarea celor 5 secunde sau fără card valid.");
        updateDoorArea("Mișcare neautorizată pe hol. Alarma a fost activată.");
    }

    setTimeout(function () {
        document.getElementById("insideLight").className = "light off";
        document.getElementById("insideText").innerText = "Nu este detectată mișcare pe hol.";

        if (alarmActive === true) {
            updateZoneDiagram("alert");
        } else if (doorOpen === true) {
            updateZoneDiagram("door-open");
        } else {
            updateZoneDiagram("");
        }
    }, 3000);
}

function activateAlarm(reason) {
    alarmActive = true;
    alarmCount++;

    closeDoor();

    document.getElementById("alarmText").innerText = "ACTIVATĂ";
    document.getElementById("alarmBanner").innerText = reason;
    document.getElementById("alarmBanner").className = "alert-box danger-box";

    document.getElementById("systemStatusText").innerText = "Alertă securitate";
    document.getElementById("systemDot").className = "status-dot offline";

    setSecurityLevel("CRITIC", "Alarmă activă. Ușa este blocată și buzzerul este pornit.");
    setBuzzer(true);
    updateZoneDiagram("alert");

    addLog("Alarmă", reason, "Alarmă");
    updateStats();
}

function disableAlarm() {
    alarmActive = false;

    document.getElementById("alarmText").innerText = "Dezactivată";
    document.getElementById("alarmBanner").innerText = "Alarma a fost dezactivată manual.";
    document.getElementById("alarmBanner").className = "alert-box safe-box";

    document.getElementById("systemStatusText").innerText = "Sistem activ";
    document.getElementById("systemDot").className = "status-dot online";

    setBuzzer(false);

    if (nightMode === true) {
        setSecurityLevel("RIDICAT", "Mod noapte activ. Monitorizarea este mai strictă.");
    } else {
        setSecurityLevel("NORMAL", "Sistemul funcționează fără alerte.");
    }

    updateZoneDiagram("");

    addLog("Alarmă", "Alarma a fost dezactivată manual", "Info");
    updateDoorArea("Alarma a fost dezactivată manual.");
}

function setNormalMode() {
    nightMode = false;

    document.getElementById("modeText").innerText = "Monitorizare normală";
    document.getElementById("accessMessage").innerText = "Mod normal activ. Sistemul așteaptă scanarea unui card RFID.";

    if (alarmActive === false && systemBlocked === false) {
        setSecurityLevel("NORMAL", "Sistemul funcționează fără alerte.");
    }

    addLog("Sistem", "Mod normal activat", "Info");
    updateDoorArea("Mod normal activat.");
}

function setNightMode() {
    nightMode = true;

    document.getElementById("modeText").innerText = "Monitorizare noapte";
    document.getElementById("accessMessage").innerText = "Mod noapte activ. Monitorizarea este mai strictă.";

    if (alarmActive === false && systemBlocked === false) {
        setSecurityLevel("RIDICAT", "Mod noapte activ. Monitorizarea este mai strictă.");
    }

    addLog("Sistem", "Mod noapte activat", "Info");
    updateDoorArea("Mod noapte activat.");
}

function testAlarm() {
    activateAlarm("Test manual alarmă pornit din panoul de administrare.");
    updateDoorArea("Test alarmă executat manual.");
}

function resetSystem() {
    if (autoCloseTimer !== null) {
        clearTimeout(autoCloseTimer);
    }

    if (blockTimer !== null) {
        clearTimeout(blockTimer);
    }

    lastValidScanTime = 0;
    doorOpen = false;
    alarmActive = false;
    nightMode = false;
    systemBlocked = false;

    validCount = 0;
    invalidCount = 0;
    outsideCount = 0;
    alarmCount = 0;
    wrongAttempts = 0;

    document.getElementById("systemStatusText").innerText = "Sistem activ";
    document.getElementById("systemDot").className = "status-dot online";

    document.getElementById("alarmText").innerText = "Dezactivată";
    document.getElementById("alarmBanner").innerText = "Sistemul funcționează normal.";
    document.getElementById("alarmBanner").className = "alert-box safe-box";

    document.getElementById("modeText").innerText = "Monitorizare normală";
    document.getElementById("accessMessage").innerText = "Sistemul așteaptă scanarea unui card RFID.";

    document.getElementById("lastCard").innerText = "-- -- -- --";
    document.getElementById("lastUser").innerText = "Utilizator: necunoscut";

    document.getElementById("outsideLight").className = "light off";
    document.getElementById("insideLight").className = "light off";
    document.getElementById("outsideText").innerText = "Nu este detectată mișcare în exterior.";
    document.getElementById("insideText").innerText = "Nu este detectată mișcare pe hol.";

    closeDoor();

    setSecurityLevel("NORMAL", "Sistemul funcționează fără alerte.");
    setBuzzer(false);
    updateZoneDiagram("");
    updateStats();

    document.getElementById("logTable").innerHTML = `
        <tr>
            <td>--:--:--</td>
            <td>Sistem</td>
            <td>Interfață resetată</td>
            <td class="status-info">Info</td>
        </tr>
    `;

    logsText = [];
    logsText.push("[" + getTime() + "] Sistem - Interfață resetată - Info");

    updateDoorArea("Ușă închisă.\nSistem resetat și pregătit pentru scanare RFID.", false);
    setLastAction("Sistem resetat");
}

function clearLogs() {
    document.getElementById("logTable").innerHTML = `
        <tr>
            <td>--:--:--</td>
            <td>Sistem</td>
            <td>Log-urile au fost șterse</td>
            <td class="status-info">Info</td>
        </tr>
    `;

    logsText = [];
    logsText.push("[" + getTime() + "] Sistem - Log-urile au fost șterse - Info");

    updateDoorArea("Log-urile au fost șterse.");
    setLastAction("Log-uri șterse");
}

function downloadLogs() {
    let content = "Jurnal evenimente - Sistem de acces inteligent\n\n";

    if (logsText.length === 0) {
        content += "Nu există log-uri salvate.\n";
    } else {
        content += logsText.join("\n");
    }

    let file = new Blob([content], { type: "text/plain" });
    let link = document.createElement("a");

    link.href = URL.createObjectURL(file);
    link.download = "loguri_sistem_acces.txt";
    link.click();

    addLog("Sistem", "Log-urile au fost descărcate", "Info");
    updateDoorArea("Fișierul cu log-uri a fost generat.");
}

function updateAccessTimer() {
    let now = Date.now();
    let differenceSeconds = (now - lastValidScanTime) / 1000;
    let remaining = Math.ceil(accessWindowSeconds - differenceSeconds);

    if (remaining > 0 && doorOpen === true) {
        document.getElementById("accessTimer").innerText = remaining + "s";
    } else {
        document.getElementById("accessTimer").innerText = "0s";
    }
}

updateStats();
setSecurityLevel("NORMAL", "Sistemul funcționează fără alerte.");
setBuzzer(false);
setLastAction("Interfață pornită");
updateDoorArea("Ușă închisă.\nSistem pregătit pentru scanare RFID.", false);
logsText.push("[" + getTime() + "] Sistem - Interfață pornită - Info");

setInterval(updateAccessTimer, 300);
