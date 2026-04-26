let lastValidScanTime = 0;
let accessWindowSeconds = 5;

let doorOpen = false;
let alarmActive = false;
let nightMode = false;

let validCount = 0;
let invalidCount = 0;
let outsideCount = 0;
let alarmCount = 0;

let autoCloseTimer = null;

function getTime() {
    let now = new Date();

    let h = now.getHours().toString().padStart(2, "0");
    let m = now.getMinutes().toString().padStart(2, "0");
    let s = now.getSeconds().toString().padStart(2, "0");

    return h + ":" + m + ":" + s;
}

function updateStats() {
    document.getElementById("validCount").innerText = validCount;
    document.getElementById("invalidCount").innerText = invalidCount;
    document.getElementById("outsideCount").innerText = outsideCount;
    document.getElementById("alarmCount").innerText = alarmCount;
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
}

function updateDoorArea(message, append = true) {
    let area = document.getElementById("doorArea");

    if (append === true) {
        area.value = "[" + getTime() + "] " + message + "\n" + area.value;
    } else {
        area.value = message;
    }
}

function openDoor() {
    doorOpen = true;

    document.getElementById("doorText").innerText = "Ușă deschisă";
    document.getElementById("doorIcon").innerText = "🔓";
    document.getElementById("doorIcon").className = "door-icon unlocked";

    document.getElementById("servoText").innerText = "Deschisă";
    document.getElementById("servoLight").className = "light green-light";

    updateDoorArea("Ușă deschisă.");
}

function closeDoor() {
    doorOpen = false;

    document.getElementById("doorText").innerText = "Ușă blocată";
    document.getElementById("doorIcon").innerText = "🔒";
    document.getElementById("doorIcon").className = "door-icon locked";

    document.getElementById("servoText").innerText = "Închisă";
    document.getElementById("servoLight").className = "light red-light";

    updateDoorArea("Ușă închisă.");
}

function scanValidCard() {
    lastValidScanTime = Date.now();
    validCount++;

    document.getElementById("lastCard").innerText = "29 CA 28 12";
    document.getElementById("accessMessage").innerText = "Card autorizat. Ușa este deschisă timp de 5 secunde.";

    openDoor();

    addLog("RFID", "Card autorizat scanat", "Permis");
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
    invalidCount++;

    document.getElementById("lastCard").innerText = "91 B3 44 A2";
    document.getElementById("accessMessage").innerText = "Card respins. Acces interzis.";

    closeDoor();

    addLog("RFID", "Card necunoscut scanat", "Respins");
    updateDoorArea("Card invalid detectat. Ușa rămâne închisă.");
    updateStats();
}

function detectOutsideMotion() {
    outsideCount++;

    document.getElementById("outsideLight").className = "light orange-light";
    document.getElementById("outsideText").innerText = "Mișcare detectată în fața ușii.";

    addLog("PIR exterior", "Persoană detectată în fața ușii", "Info");
    updateDoorArea("Mișcare detectată în exterior, în fața ușii.");
    updateStats();

    setTimeout(function () {
        document.getElementById("outsideLight").className = "light off";
        document.getElementById("outsideText").innerText = "Nu este detectată mișcare în exterior.";
    }, 3000);
}

function detectInsideMotion() {
    document.getElementById("insideLight").className = "light orange-light";
    document.getElementById("insideText").innerText = "Mișcare detectată pe hol.";

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
    }, 3000);
}

function activateAlarm(reason) {
    alarmActive = true;
    alarmCount++;

    document.getElementById("alarmText").innerText = "ACTIVATĂ";
    document.getElementById("alarmBanner").innerText = reason;
    document.getElementById("alarmBanner").className = "alert-box danger-box";

    document.getElementById("systemStatusText").innerText = "Alertă securitate";
    document.getElementById("systemDot").className = "status-dot offline";

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

    addLog("Alarmă", "Alarma a fost dezactivată manual", "Info");
    updateDoorArea("Alarma a fost dezactivată manual.");
}

function setNormalMode() {
    nightMode = false;

    document.getElementById("modeText").innerText = "Monitorizare normală";
    document.getElementById("accessMessage").innerText = "Mod normal activ. Sistemul așteaptă scanarea unui card RFID.";

    addLog("Sistem", "Mod normal activat", "Info");
    updateDoorArea("Mod normal activat.");
}

function setNightMode() {
    nightMode = true;

    document.getElementById("modeText").innerText = "Monitorizare noapte";
    document.getElementById("accessMessage").innerText = "Mod noapte activ. Monitorizarea este mai strictă.";

    addLog("Sistem", "Mod noapte activat", "Info");
    updateDoorArea("Mod noapte activat.");
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

    updateDoorArea("Log-urile au fost șterse.");
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

updateDoorArea("Ușă închisă.\nSistem pregătit pentru scanare RFID.", false);

setInterval(updateAccessTimer, 300);
