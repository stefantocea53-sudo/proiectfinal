let doorOpen = false;
let alarmActive = false;

let allowedCount = 0;
let rejectedCount = 0;
let alertCount = 0;
let totalLogs = 0;

function getTime() {
    let now = new Date();
    let h = now.getHours().toString().padStart(2, "0");
    let m = now.getMinutes().toString().padStart(2, "0");
    let s = now.getSeconds().toString().padStart(2, "0");

    return h + ":" + m + ":" + s;
}

function updateStats() {
    document.getElementById("allowedCount").innerText = allowedCount;
    document.getElementById("rejectedCount").innerText = rejectedCount;
    document.getElementById("alertCount").innerText = alertCount;
    document.getElementById("totalLogs").innerText = totalLogs;
}

function openDoor() {
    doorOpen = true;

    let doorStatus = document.getElementById("doorStatus");
    doorStatus.innerText = "DESCHISĂ";
    doorStatus.className = "big-status green";

    document.getElementById("doorInfo").innerText = "Ușa este deschisă pentru acces autorizat.";

    addSecurityLog("Ușă", "Ușa a fost deschisă manual", "Info");
}

function closeDoor() {
    doorOpen = false;

    let doorStatus = document.getElementById("doorStatus");
    doorStatus.innerText = "ÎNCHISĂ";
    doorStatus.className = "big-status red";

    document.getElementById("doorInfo").innerText = "Ușa este blocată pentru acces neautorizat.";

    addSecurityLog("Ușă", "Ușa a fost închisă", "Info");
}

function activateAlarm() {
    alarmActive = true;

    let alarmStatus = document.getElementById("alarmStatus");
    alarmStatus.innerText = "ACTIVATĂ";
    alarmStatus.className = "big-status red";

    document.getElementById("alarmInfo").innerText = "Sistemul de alarmă este activ.";

    alertCount++;
    addSecurityLog("Alarmă", "Alarma a fost activată", "Avertizare");
    updateStats();
}

function deactivateAlarm() {
    alarmActive = false;

    let alarmStatus = document.getElementById("alarmStatus");
    alarmStatus.innerText = "DEZACTIVATĂ";
    alarmStatus.className = "big-status green";

    document.getElementById("alarmInfo").innerText = "Sistemul de alarmă nu este activ.";

    addSecurityLog("Alarmă", "Alarma a fost dezactivată", "Info");
}

function setNormalMode() {
    let mode = document.getElementById("modeStatus");
    mode.innerText = "NORMAL";
    mode.className = "big-status blue";

    addSecurityLog("Sistem", "Modul normal a fost activat", "Info");
}

function setNightMode() {
    let mode = document.getElementById("modeStatus");
    mode.innerText = "NOAPTE";
    mode.className = "big-status purple";

    activateAlarm();
    addSecurityLog("Sistem", "Modul de noapte a fost activat", "Avertizare");
}

function scanAllowedCard() {
    let cod = "29 CA 28 12";
    let user = "Administrator";

    document.getElementById("rfidCode").innerText = cod;
    document.getElementById("rfidInfo").innerText = "Card autorizat. Acces permis.";

    allowedCount++;
    openDoor();

    addAccessLog(cod, user, "Permis", "Deschisă");
    updateStats();
}

function scanRejectedCard() {
    let cod = "91 B3 44 A2";
    let user = "Necunoscut";

    document.getElementById("rfidCode").innerText = cod;
    document.getElementById("rfidInfo").innerText = "Card necunoscut. Acces respins.";

    rejectedCount++;
    alertCount++;

    closeDoor();

    addAccessLog(cod, user, "Respins", "Închisă");
    addSecurityLog("RFID", "Tentativă de acces cu un card necunoscut", "Critic");

    updateStats();
}

function simulateMotion() {
    let motionStatus = document.getElementById("motionStatus");

    motionStatus.innerText = "Mișcare";
    motionStatus.className = "badge orange";

    if (alarmActive === true) {
        alertCount++;
        addSecurityLog("PIR", "Mișcare detectată cu alarma activă", "Critic");
    } else {
        addSecurityLog("PIR", "Mișcare detectată în mod normal", "Info");
    }

    updateStats();

    setTimeout(function() {
        motionStatus.innerText = "Normal";
        motionStatus.className = "badge blue";
    }, 4000);
}

function simulateGasAlert() {
    let gasStatus = document.getElementById("gasStatus");

    gasStatus.innerText = "Pericol";
    gasStatus.className = "badge red";

    alertCount++;
    activateAlarm();
    addSecurityLog("Gaz/Fum", "Nivel periculos detectat", "Critic");

    updateStats();

    setTimeout(function() {
        gasStatus.innerText = "Sigur";
        gasStatus.className = "badge green";
    }, 5000);
}

function updateTemperatureAndHumidity() {
    let temp = Math.floor(Math.random() * 8) + 22;
    let humidity = Math.floor(Math.random() * 20) + 40;

    document.getElementById("tempValue").innerText = temp + "°C";
    document.getElementById("humidityValue").innerText = humidity + "%";
}

function addAccessLog(cod, user, status, usa) {
    let table = document.getElementById("accessLog");

    let row = document.createElement("tr");

    let statusClass = "neutral";

    if (status === "Permis") {
        statusClass = "permis";
    }

    if (status === "Respins") {
        statusClass = "respins";
    }

    row.innerHTML = `
        <td>${getTime()}</td>
        <td>${cod}</td>
        <td>${user}</td>
        <td class="${statusClass}">${status}</td>
        <td>${usa}</td>
    `;

    table.prepend(row);

    totalLogs++;
    updateStats();
}

function addSecurityLog(source, event, level) {
    let table = document.getElementById("securityLog");

    let row = document.createElement("tr");

    let levelClass = "neutral";

    if (level === "Info") {
        levelClass = "permis";
    }

    if (level === "Avertizare") {
        levelClass = "neutral";
    }

    if (level === "Critic") {
        levelClass = "respins";
    }

    row.innerHTML = `
        <td>${getTime()}</td>
        <td>${source}</td>
        <td>${event}</td>
        <td class="${levelClass}">${level}</td>
    `;

    table.prepend(row);

    totalLogs++;
    updateStats();
}

function autoSimulation() {
    let random = Math.floor(Math.random() * 5);

    if (random === 0) {
        scanAllowedCard();
    }

    if (random === 1) {
        scanRejectedCard();
    }

    if (random === 2) {
        simulateMotion();
    }

    if (random === 3) {
        updateTemperatureAndHumidity();
    }
}

updateStats();
setInterval(updateTemperatureAndHumidity, 5000);
setInterval(autoSimulation, 12000);
