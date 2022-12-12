const jsonBigInt = require("json-bigint");
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  maxHttpBufferSize: 1e8 // 100 MB
});

//Queue for new questions added from admin ui
questionsQueue = [];

//Queue of next questions for the game
randomQuestionsQueue = [];

const stableServer = {
  hostname: '127.0.0.1',
  port: 7860,
  path: '/sdapi/v1/img2img',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
};

const roundSpeed = 2000;

//Players, points and last message
/*Player model
 { "pseudo": pseudo, "points": 0, "message": "", "socketId": socket.id }
*/
var playersList = [
]

var currentQuestion;
var currentImageIndex = 0;
var isRoundFinished = false;
var roundNb = 0;
var isGeneratingPicture = false;

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

  //Send list of already connected users to the new user
  for (const player of playersList) {
    socket.emit("addPlayer", { "pseudo": player.pseudo, "points": player.points, "message": player.message });
  }

  //Send round info
  if (currentQuestion != null) {
    socket.emit("newRound", {
      "nbImages": currentQuestion.noiseValues.length,
      "roundNb": roundNb
    });
  }

  socket.on("setPseudo", (pseudo) => {
    var newPlayer = { "pseudo": pseudo, "points": 0, "message": "", "socketId": socket.id };
    playersList.push(newPlayer)
    console.log("User connected and set its pseudo to " + pseudo);
    io.emit("addPlayer", newPlayer)
  });

  socket.on('message', (playerPseudo, message) => {
    console.log(`Received message "${message}" from "${playerPseudo}"`);
    if (message.toLowerCase() == currentQuestion.answer.toLowerCase()) {
      console.log("Player found the answer!");
      playerWinRound(socket);
    } else {
      io.emit('message', playerPseudo, message);
    }
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
});

function playerWinRound(winningSocket) {
  for (let i = 0; i < playersList.length; i++) {
    if (playersList[i].socketId == winningSocket.id) {
      playersList[i].points += 5;//TODO give points based on remaining time
      io.emit("winRound", playersList);
      finishCurrentQuestion(playersList[i].pseudo);
      return;
    }
  }
}

function sendLog(log) {
  console.log("Sending log to client", log);
  io.emit("adminLog", {
    "logMessage": log
  });
}

async function startNewQuestion() {
  console.log("New question started");
  isRoundFinished = false;
  roundNb += 1;
  //currentQuestion = await retrieveRandomQuestion();
  if (randomQuestionsQueue.length <= 0) {
    await generateRandomQuestionsQueue();
  }
  currentQuestion = randomQuestionsQueue.shift();
  if (currentQuestion == null) return;
  currentImageIndex = currentQuestion.noiseValues.length - 1;
  console.log(`Question chosen is ${JSON.stringify(currentQuestion)} and has ${currentQuestion.noiseValues.length} images`);
  io.emit("newRound", {
    "nbImages": currentQuestion.noiseValues.length,
    "roundNb": roundNb
  });
  retrieveQuestionImageFromDB(currentQuestion.name, currentQuestion.noiseValues[currentImageIndex]).then(downloadedImage => {
    io.emit("newImage", {
      "image": downloadedImage,
      "imageIndex": 0
    });
  });
  loopRound();
}

async function loopRound() {
  await timer(roundSpeed);
  sendNextImage();
}

function sendNextImage() {
  currentImageIndex -= 1;
  //console.log(`Next image, image ${currentImageIndex} / ${currentQuestion.noiseValues.length}`);
  if (currentImageIndex <= 0 || isRoundFinished) {
    finishCurrentQuestion();
  } else {
    retrieveQuestionImageFromDB(currentQuestion.name, currentQuestion.noiseValues[currentImageIndex]).then(downloadedImage => {
      io.emit("newImage", {
        "image": downloadedImage,
        "imageIndex": currentImageIndex
      });
    });

    retrieveQuestionImageFromDB(currentQuestion.name, currentQuestion.noiseValues[currentImageIndex]);
    loopRound();
  }
}

async function finishCurrentQuestion(winnerPseudo) {
  if (isRoundFinished == false) {
    isRoundFinished = true;
    io.emit("questionResult", currentQuestion, winnerPseudo);
    await timer(10000);
    startNewQuestion();
  }
}

function addNewQuestion(newQuestion) {
  console.log("New question received from admin page, prompt is " + newQuestion.prompt + ", answer is " + newQuestion.answer);
  if (!isGeneratingPicture) {
    var noiseValues = [];
    noiseValues.push(0);
    for (var denoise = 0.3; denoise <= 0.99; denoise = parseFloat((denoise + 0.02).toFixed(2))) {
      noiseValues.push(denoise);
    }

    isGeneratingPicture = true;
    const name = newQuestion.answer.trim().split(" ").join("_");
    newQuestion.answer = newQuestion.answer.trim().toLowerCase();
    newQuestion.prompt = newQuestion.prompt.trim().toLowerCase();
    const question = {
      "name": name,
      "prompt": newQuestion.prompt,
      "answer": newQuestion.answer,
      "active": false,
      "noiseValues": noiseValues
    }
    insertObjectIntoDB("questions", question);
    generateStableImages(name, newQuestion, noiseValues);
  } else {
    questionsQueue.push(newQuestion);
    sendLog("Already busy with generation, added to queue, queue length is " + questionsQueue.length);
  }
}

async function generateStableImages(name, newQuestion, noiseValues) {
  sendLog("Starting generation of images");
  let seed = '';
  for (let i = 0; i < 10; i++) {
    seed += Math.floor(Math.random() * 10);
  }

  var payload = {
    "init_images": [newQuestion.image],
    "denoising_strength": 0.0,
    "prompt": newQuestion.prompt,
    "seed": -1,
    "sampler_name": "Euler a",
    "batch_size": 1,
    "n_iter": 1,
    "steps": 10,
    "cfg_scale": 7,
    "width": 512,
    "height": 512,
    "restore_faces": false,
    "tiling": false,
    "negative_prompt": "nsfw, naked, nude, nipples, deformed, cropped, blurry, merged",
    "eta": 0,
    "s_churn": 0,
    "s_tmax": 0,
    "s_tmin": 0,
    "s_noise": 1,
    "override_settings": {},
    "sampler_index": "0",
    "include_init_images": false
  }

  for (let i in noiseValues) {
    denoise = noiseValues[i];
    var payloadNoise = payload;
    payloadNoise.denoising_strength = denoise;

    const denoisePromise = new Promise((resolve, reject) => {

      const req = http.request(stableServer, (res) => {
        var data = [];
        res.on('data', function (chunk) {
          data.push(chunk);
        }).on("end", () => {
          var jsonString = Buffer.concat(data).toString();
          const jsonObject = JSON.parse(jsonString);
          insertQuestionImageIntoDB(name, denoise, jsonObject.images[0]);
          sendLog("Generated image with denoise: " + denoise);
          resolve();
        });
      });
      req.on('error', (error) => {
        // handle any error that occurs while making the request
        sendLog("sdapi return error");
        console.error(error);
        reject(error);
      });
      req.write(JSON.stringify(payloadNoise));
      req.end();
    });
    await denoisePromise;
    if (parseFloat((denoise + 0.02).toFixed(2)) >= 0.99) {
      sendLog("Generation finished");
      enableQuestion(name);
      isGeneratingPicture = false;
      if (questionsQueue.length > 0) {
        sendLog(questionsQueue.length + " questions pending in queue, proceeding to next generation");
        addNewQuestion(questionsQueue.shift());
      } else {
        sendLog("Queue empty");
      }
    }
  }
}


//DATABASE stuff
mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
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
  generateRandomQuestionsQueue();
  await startNewQuestion(); //START THE GAME
});

async function insertObjectIntoDB(collection, object) {
  //console.log("Inserting object " + JSON.stringify(object) + " into collection " + collection);
  const selectedCollection = dbClient.db(dbName).collection(collection);
  const result = await selectedCollection.insertOne(object);
  console.log("Inserted object into collection " + collection)
}

async function insertQuestionImageIntoDB(name, noise, base64Image) {
  const bucket = new mongodb.GridFSBucket(dbClient.db(dbName), { bucketName: "imagesBucket" });

  const imageBuffer = new Buffer.from(base64Image, "base64");
  bucket.openUploadStream(name, {
    metadata: {
      noise: noise
    }
  }).
    on('error', (error) => {
      console.log('Error occurred while uploading image', error);
    }).
    on('finish', (file) => {
      //console.log('Image uploaded successfully', file);
      //client.close();
    }).
    end(imageBuffer);
}

function retrieveQuestionImageFromDB(name, noise) {
  return new Promise((resolve, reject) => {
    const bucket = new mongodb.GridFSBucket(dbClient.db(dbName), { bucketName: "imagesBucket" });
    bucket.find({
      filename: name,
      'metadata.noise': noise
    }).toArray((error, files) => {
      if (error) {
        console.log('Error occurred while retrieving image', error);
        reject(error);
      } else if (files.length > 0) {
        //v2 download all images here?
        const file = files[0];
        const downloadStream = bucket.openDownloadStream(file._id);
        let imageData = [];
        downloadStream.on('data', (chunk) => {
          imageData.push(chunk);
        });
        downloadStream.on('error', (error) => {
          console.log('Error occurred while downloading image', error);
          reject(error);
        });
        downloadStream.on('end', () => {
          const downloadedImage = "data:image/png;base64," + Buffer.concat(imageData).toString("base64");
          resolve(downloadedImage);
        });
      } else {
        console.log('Image not found');
        reject(new Error('Image not found'));
      }
    });
  });
}

async function enableQuestion(name) {
  const selectedCollection = dbClient.db(dbName).collection("questions");
  const result = await selectedCollection.updateOne(
    { name: name },
    { $set: { "active": true } }
  );
  console.log("Enabled question " + name);
}

async function retrieveRandomQuestion() {
  const questionsColl = dbClient.db(dbName).collection("questions");
  return await questionsColl.aggregate([
    { $match: { active: true } },
    { $sample: { size: 1 } }
  ]).next();
}

async function generateRandomQuestionsQueue() {
  const questionsColl = dbClient.db(dbName).collection("questions");
  const questions = await questionsColl.aggregate([
    { $match: { active: true } }  ]).toArray();
  randomQuestionsQueue = randomizeArray(questions);
  console.log("Generated random questions queue, size: "+randomQuestionsQueue.length);
}

//Utilities
//await timer(3000)
const timer = ms => new Promise(res => setTimeout(res, ms))

function randomizeArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}