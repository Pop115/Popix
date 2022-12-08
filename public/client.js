var playerPseudo = "";

// Connect to the socket.io server
const socket = io();
blurElement("mainPage");

const pseudoForm = document.getElementById("pseudoForm");
const pseudoModal = document.getElementById("pseudoModal");
const pseudoInput = document.getElementById("pseudoInput");
pseudoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    pseudoModal.style.display = "none";
    socket.emit('setPseudo', pseudoInput.value);
    playerPseudo = pseudoInput.value;
    unblurElement("mainPage");
});


//Send message when pressing Enter on promptInput
const promptInput = document.getElementById('promptInput');
promptInput.addEventListener('keydown', event => {
    if (event.key === "Enter") {
        const message = promptInput.value;
        socket.emit('message', playerPseudo, message);
        promptInput.value = '';
    }
});

// Handle incoming messages
socket.on('message', (name, message) => {
    console.log("Received message " + message + " from " + name)
    var playerMessageElem = document.getElementById(name).getElementsByClassName("playerMessage")[0];
    playerMessageElem.innerHTML = message;
});

socket.on("addPlayer", player => {
    addPlayer(player.pseudo, player.points, player.message);
});

socket.on("removePlayer", player => {
    removePlayer(player);
});

const imageToFind = document.getElementById("imageToFind");
const imageIndex = document.getElementById("imageIndex");
socket.on("newImage", newImageInfo => {
    imageToFind.src = newImageInfo.image;
    imageIndex.innerHTML = newImageInfo.imageIndex;
});

const nbImages = document.getElementById("nbImages");
const roundAnswerP = document.getElementById("roundAnswerP");
const roundAnswer = document.getElementById("roundAnswer");
socket.on("newRound", (roundInfo) => {
    console.log("New round");
    nbImages.innerHTML = roundInfo.nbImages;
    roundAnswerP.display = "none";
    roundAnswer.innerHTML = "";
});

socket.on("questionResult", question => {
    roundAnswerP.display = "block";
    roundAnswer.innerHTML = question.answer;
});

function addPlayer(name, points, message) {
    // Create a new <div> element for the player
    var newPlayer = document.createElement("div");
    newPlayer.className = "playerDiv";
    newPlayer.id = name;

    var nameElem = document.createElement("span");
    nameElem.className = "playerName";
    nameElem.innerHTML = name;
    newPlayer.appendChild(nameElem);

    var pointsElem = document.createElement("span");
    pointsElem.className = "playerPoints";
    pointsElem.innerHTML = points;
    newPlayer.appendChild(pointsElem);

    var messageElem = document.createElement("span");
    messageElem.className = "playerMessage";
    messageElem.innerHTML = message;
    newPlayer.appendChild(messageElem);

    var playerList = document.getElementById("playerList");

    playerList.appendChild(newPlayer);
}

function removePlayer(player) {
    document.getElementById(player.pseudo).remove();
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