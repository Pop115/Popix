// Connect to the socket.io server
const socket = io();

blurElement("main-page");

const pseudoForm = document.getElementById("pseudo-form");
const pseudoModal = document.getElementById("pseudo-modal");
const pseudoInput = document.getElementById("pseudo-input");
pseudoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    pseudoModal.style.display = "none";
    socket.emit('set-pseudo', pseudoInput.value);
    unblurElement("main-page");
});



const form = document.getElementById('prompt-input');
form.addEventListener('submit', event => {
    event.preventDefault();

    // Get the message from the input field
    const input = document.getElementById('prompt-input');
    const message = input.value;

    // Send the message to the socket.io server
    socket.emit('message', message);

    // Clear the input field
    input.value = '';
});

// Handle incoming messages
socket.on('message', (name, message) => {
    var playerMessageElem = document.getElementById(name).getElementsByClassName("player-message")[0];
    playerMessageElem.innerHTML = message;
});

socket.on("add-player", (name) => {
    addPlayer(name, 0, "");
});

function addPlayer(name, points, message) {
    // Create a new <div> element for the player
    var newPlayer = document.createElement("div");
    newPlayer.className = "player-div";
    newPlayer.id = name;

    var nameElem = document.createElement("span");
    nameElem.className = "player-name";
    nameElem.innerHTML = name;
    newPlayer.appendChild(nameElem);

    var pointsElem = document.createElement("span");
    pointsElem.className = "player-points";
    pointsElem.innerHTML = points;
    newPlayer.appendChild(pointsElem);

    var messageElem = document.createElement("span");
    messageElem.className = "player-message";
    messageElem.innerHTML = message;
    newPlayer.appendChild(messageElem);

    var playerList = document.getElementById("player-list");

    playerList.appendChild(newPlayer);
}



function randomString() {
    // Create an empty string to store the random characters
    var str = "";

    // Generate 10 random characters and add them to the string
    for (var i = 0; i < 10; i++) {
        // Generate a random number between 0 and 25
        var num = Math.floor(Math.random() * 26);

        // Convert the number to the corresponding character in the ASCII table
        // and add it to the string
        str += String.fromCharCode(97 + num);
    }

    return str;
}

function blurElement(id) {
    const element = document.getElementById(id);
    element.style.filter = 'blur(5px)';
}

// Function to remove the blur from the element with the specified ID
function unblurElement(id) {
    const element = document.getElementById(id);
    element.style.filter = 'none';
}