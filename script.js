let lastValidScanTime = 0;
let accessWindowSeconds = 5;

let doorOpen = false;
let alarmActive = false;
let nightMode = false;

let validCount = 0;
let invalidCount = 0;
let outsideCount = 0;
let alarmCount = 0;

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
    }

    if (status === "Respins") {
        statusClass = "status-warning";
    }

    if (status === "Alarmă") {
        statusClass = "status-danger";
    }

    if (status === "Info") {
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

function scanValidCard() {
    lastValidScanTime = Date.now();
    validCount++;

    document.getElementById("lastCard").innerText = "29 CA 28 12";
    document.getElementById("accessMessage").innerText = "Card autorizat. Acces permis pentru 5 secunde.";

    openDoor();

    addLog("RFID", "Card autorizat scanat", "Permis");
    updateStats();

    setTimeout(function() {
        if (doorOpen === true) {
            closeDoor();
        }
    }, 5000);
}

function scanInvalidCard() {
    invalidCount++;

    document.getElementById("lastCard").innerText = "91 B3 44 A2";
    document.getElementById("accessMessage").innerText = "Card respins. Accesul nu este permis.";

    closeDoor();

    addLog("RFID", "Card necunoscut scanat", "Respins");
    updateStats();
}

function openDoor() {
    doorOpen = true;

    document.getElementById("doorText").innerText = "Ușă deschisă";
    document.getElementById("doorIcon").innerText = "🔓";
    document.getElementById("doorIcon").className = "door-icon unlocked";

    document.getElementById("servoText").innerText = "Deschisă";
    document.getElementById("servoLight").className = "sensor-light green-light";
}

function closeDoor() {
    doorOpen = false;

    document.getElementById("doorText").innerText = "Ușă blocată";
    document.getElementById("doorIcon").innerText = "🔒";
    document.getElementById("doorIcon").className = "door-icon locked";

    document.getElementById("servoText").innerText = "Închisă";
    document.getElementById("servoLight").className = "sensor-light red-light";
}

function detectOutsideMotion() {
    outsideCount++;

    document.getElementById("outsideLight").className = "sensor-light orange-light";
    document.getElementById("outsideText").innerText = "Mișcare detectată în fața ușii.";

    addLog("PIR exterior", "Persoană detectată în fața ușii", "Info");
    updateStats();

    setTimeout(function() {
        document.getElementById("outsideLight").className = "sensor-light off";
        document.getElementById("outsideText").innerText = "Nu este detectată mișcare în exterior.";
    }, 3000);
}

function detectInsideMotion() {
    document.getElementById("insideLight").className = "sensor-light orange-light";
    document.getElementById("insideText").innerText = "Mișcare detectată pe hol.";

    let now = Date.now();
    let differenceSeconds = (now - lastValidScanTime) / 1000;

    if (differenceSeconds <= accessWindowSeconds) {
        addLog("PIR interior", "Mișcare pe hol după scanare RFID validă", "Permis");
    } else {
        activateAlarm("Mișcare pe hol fără card scanat în ultimele 5 secunde");
    }

    setTimeout(function() {
        document.getElementById("insideLight").className = "sensor-light off";
        document.getElementById("insideText").innerText = "Nu este detectată mișcare pe hol.";
    }, 3000);
}

function activateAlarm(reason) {
    alarmActive = true;
    alarmCount++;

    document.getElementById("alarmText").innerText = "ACTIVATĂ";
    document.getElementById("alarmBanner").innerText = reason;
    document.getElementById("alarmBanner").className = "alarm-banner danger";

    document.getElementById("systemStatusText").innerText = "Alertă securitate";
    document.getElementById("systemDot").className = "dot offline";

    addLog("Alarmă", reason, "Alarmă");
    updateStats();
}

function disableAlarm() {
    alarmActive = false;

    document.getElementById("alarmText").innerText = "Dezactivată";
    document.getElementById("alarmBanner").innerText = "Alarma a fost dezactivată manual.";
    document.getElementById("alarmBanner").className = "alarm-banner safe";

    document.getElementById("systemStatusText").innerText = "Sistem activ";
    document.getElementById("systemDot").className = "dot online";

    addLog("Alarmă", "Alarma a fost dezactivată manual", "Info");
}

function setNormalMode() {
    nightMode = false;

    document.getElementById("modeText").innerText = "Monitorizare normală";
    document.getElementById("accessMessage").innerText = "Mod normal activ. Așteptare scanare card RFID.";

    addLog("Sistem", "Mod normal activat", "Info");
}

function setNightMode() {
    nightMode = true;

    document.getElementById("modeText").innerText = "Monitorizare noapte";
    document.getElementById("accessMessage").innerText = "Mod noapte activ. Securitatea este crescută.";

    addLog("Sistem", "Mod noapte activat", "Info");
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
}

function updateAccessTimer() {
    let now = Date.now();
    let differenceSeconds = (now - lastValidScanTime) / 1000;
    let remaining = Math.ceil(accessWindowSeconds - differenceSeconds);

    if (remaining > 0) {
        document.getElementById("accessTimer").innerText = remaining + "s";
    } else {
        document.getElementById("accessTimer").innerText = "0s";
    }
}

updateStats();
setInterval(updateAccessTimer, 300);
