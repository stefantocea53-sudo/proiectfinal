let doorOpen = false;
let alarmActive = false;

function getTime() {
    let now = new Date();
    let h = now.getHours().toString().padStart(2, "0");
    let m = now.getMinutes().toString().padStart(2, "0");
    return h + ":" + m;
}

function openDoor() {
    doorOpen = true;

    let doorStatus = document.getElementById("doorStatus");
    doorStatus.innerText = "DESCHISĂ";
    doorStatus.className = "status deschisa";

    addLog("29 CA 28 12", "Administrator", "Permis", "Deschisă");
}

function closeDoor() {
    doorOpen = false;

    let doorStatus = document.getElementById("doorStatus");
    doorStatus.innerText = "ÎNCHISĂ";
    doorStatus.className = "status inchisa";

    addLog("Sistem", "Automat", "Închidere", "Închisă");
}

function activateAlarm() {
    alarmActive = true;

    let alarmStatus = document.getElementById("alarmStatus");
    alarmStatus.innerText = "ACTIVATĂ";
    alarmStatus.className = "status activata";

    addLog("Sistem", "Administrator", "Alarmă activată", doorOpen ? "Deschisă" : "Închisă");
}

function deactivateAlarm() {
    alarmActive = false;

    let alarmStatus = document.getElementById("alarmStatus");
    alarmStatus.innerText = "DEZACTIVATĂ";
    alarmStatus.className = "status dezactivata";

    addLog("Sistem", "Administrator", "Alarmă dezactivată", doorOpen ? "Deschisă" : "Închisă");
}

function addLog(cod, utilizator, status, usa) {
    let table = document.getElementById("logTable");

    let row = document.createElement("tr");

    let statusClass = "";
    if (status === "Permis") {
        statusClass = "permis";
    } else if (status === "Respins") {
        statusClass = "respins";
    }

    row.innerHTML = `
        <td>${getTime()}</td>
        <td>${cod}</td>
        <td>${utilizator}</td>
        <td class="${statusClass}">${status}</td>
        <td>${usa}</td>
    `;

    table.prepend(row);
}

function simulateRFID() {
    let cards = [
        {
            cod: "29 CA 28 12",
            user: "Administrator",
            status: "Permis"
        },
        {
            cod: "91 B3 44 A2",
            user: "Necunoscut",
            status: "Respins"
        },
        {
            cod: "53 7F 21 C9",
            user: "Student",
            status: "Permis"
        }
    ];

    let randomCard = cards[Math.floor(Math.random() * cards.length)];

    document.getElementById("rfidCode").innerText = randomCard.cod;
    document.getElementById("rfidResult").innerText = "Acces " + randomCard.status.toLowerCase();

    if (randomCard.status === "Permis") {
        let doorStatus = document.getElementById("doorStatus");
        doorStatus.innerText = "DESCHISĂ";
        doorStatus.className = "status deschisa";
        doorOpen = true;

        addLog(randomCard.cod, randomCard.user, "Permis", "Deschisă");
    } else {
        let doorStatus = document.getElementById("doorStatus");
        doorStatus.innerText = "ÎNCHISĂ";
        doorStatus.className = "status inchisa";
        doorOpen = false;

        addLog(randomCard.cod, randomCard.user, "Respins", "Închisă");
    }
}

function simulateMotion() {
    let motion = Math.random() > 0.7;

    let motionStatus = document.getElementById("motionStatus");

    if (motion) {
        motionStatus.innerText = "MIȘCARE";
        motionStatus.className = "status activata";

        if (alarmActive) {
            addLog("PIR", "Senzor mișcare", "Alarmă", doorOpen ? "Deschisă" : "Închisă");
        }
    } else {
        motionStatus.innerText = "NORMAL";
        motionStatus.className = "status normal";
    }
}

setInterval(simulateRFID, 7000);
setInterval(simulateMotion, 5000);
