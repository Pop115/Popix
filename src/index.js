const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const roundSpeed = 3000;

//Players, points and last message
//Ex:
var playersList = [
]

var currentQuestion;
var currentImages;
var currentImageIndex = 0;
var isRoundFinished = false;
var roundNb = 1;

app.use(express.static('public/'));
app.use('/socketio', express.static('node_modules/socket.io/client-dist/'));

app.get('/admin', (req, res) => {
  res.sendFile('admin/admin.html', { root: "public/" });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});


io.on('connection', socket => {
  console.log('A user connected');

  for (const player of playersList) {
    socket.emit("addPlayer", { "pseudo": player.pseudo, "points": player.points, "message": player.message });
  }

  socket.on("setPseudo", (pseudo) => {
    var newPlayer = { "pseudo": pseudo, "points": 0, "message": "", "socketId": socket.id };
    playersList.push(newPlayer)
    console.log("User connected and set its pseudo to " + pseudo);
    io.emit("addPlayer", newPlayer)
  });

  socket.on('message', (playerPseudo, message) => {
    console.log(`Received message "${message}" from "${playerPseudo}"`);
    io.emit('message', playerPseudo, message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    var disconnectedPlayer = playersList.filter(player => player.socketId === socket.id)[0];
    playersList = playersList.filter(player => player.socketId !== socket.id);
    io.emit("removePlayer", disconnectedPlayer)
  });


  socket.on("newQuestion", (newQuestion) => {
    addNewQuestion(newQuestion);
  });

  socket.on("generate64", (questionName, directoryPath) => {
    //convertPicturesFromDirectory(questionName, directoryPath);
  });
});


async function startNewQuestion() {
  console.log("New question started");
  isRoundFinished = false;
  currentQuestion = await retrieveRandomQuestion();
  currentImages = await retrieveImagesWithName(currentQuestion.name);
  currentImageIndex = 0;
  console.log(`Question chosen is ${JSON.stringify(currentQuestion)} and has ${currentImages.length} images`);
  io.emit("newRound", {
    "nbImages": currentImages.length,
    "roundNb": roundNb
  });
  io.emit("newImage", {
    "image": currentImages[0],
    "imageIndex": 0
  });
  loopRound();
}

async function loopRound() {
  await timer(roundSpeed);
  sendNextImage();
}

function sendNextImage() {
  currentImageIndex += 1;
  console.log(`Next image, image ${currentImageIndex} / ${currentImages.length}`);
  if (currentImageIndex >= currentImages.length) {
    finishCurrentQuestion();
  } else {
    io.emit("newImage", {
      "image": currentImages[currentImageIndex],
      "imageIndex": currentImageIndex
    });
    loopRound();
  }
}

async function finishCurrentQuestion() {
  isRoundFinished = true;
  io.emit("questionResult", currentQuestion);
  await timer(10000);
  startNewQuestion();
}

async function addNewQuestion(newQuestion) {
  const name = newQuestion.answer.split(" ").join("_")

  const question = {
    "name": name,
    "prompt": newQuestion.prompt,
    "answer": newQuestion.answer
  }
  insertObjectIntoDB("questions", question);

  const images = {
    "name": name,
    "images": newQuestion.images
  }
  insertObjectIntoDB("images", images);
}


//DATABASE stuff
const MongoClient = require('mongodb').MongoClient;
const dbClient = new MongoClient('mongodb://127.0.0.1:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const dbName = 'popix';

dbClient.connect(async (err) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Connected to MongoDB server');
  await startNewQuestion();
});

async function insertObjectIntoDB(collection, object) {
  console.log("Inserting object " + JSON.stringify(object) + " into collection " + collection)
  const selectedCollection = dbClient.db(dbName).collection(collection);
  const result = await selectedCollection.insertOne(object);
}

async function retrieveRandomQuestion() {
  const questionsColl = dbClient.db(dbName).collection("questions");
  return await questionsColl.aggregate([{ $sample: { size: 1 } }]).next();
}

async function retrieveImagesWithName(name) {
  const imagesColl = dbClient.db(dbName).collection("images");
  var result = await imagesColl.findOne({ "name": name });
  return result.images;
}

//Utilities

//ES7 way to wait
//await timer(3000)
const timer = ms => new Promise(res => setTimeout(res, ms))












// Import the 'fs' and 'path' modules
const fs = require('fs');
const path = require('path');

function convertPicturesFromDirectory(name, directory) {
  console.log("Converting images of folder " + directory + " into JSON containing base64 images");

  // Get a list of all files in the directory
  const files = fs.readdirSync(directory);

  // Create an empty array to store the base64-encoded images
  const images = [];

  var index = files.length;
  const step = 1;
  // Loop through the files in the directory
  for (const file of files) {
    // Get the path to the file
    const filePath = path.join(directory, file);

    // Read the file as a binary buffer
    const buffer = fs.readFileSync(filePath);

    console.log("Converting " + filePath);

    // Convert the buffer to a base64-encoded string
    const base64 = buffer.toString('base64');

    const picObj = {
      "name": name,
      "index": index,
      "base64": base64
    }

    insertObjectIntoDB("images", picObj);
    index = index - step;

    // Add the base64-encoded image to the array
    //images.push(base64);
  }

  // Convert the array of images to a JSON string
  //const json = JSON.stringify(images);

  // Save the JSON string to a file
  //fs.writeFileSync('images.json', json);
  console.log("Finished conversion, result is in images.json")
  //console.log(json);
}
