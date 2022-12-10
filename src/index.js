const jsonBigInt = require("json-bigint");
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  maxHttpBufferSize: 1e8 // 100 MB
});

const stableServer = {
  hostname: '127.0.0.1',
  port: 7860,
  path: '/sdapi/v1/img2img',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
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
    if (message.toLowerCase() == prompt.toLowerCase()) {
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

function playerWinRound(socket) {
  for (let i = 0; i < playersList.length; i++) {
    if (playersList[i].socketId = socket.id) {
      playersList[i].points += 5;//TODO give points based on remaining time
      socket.emit("winRound", playersList);
    }
  }
}

async function startNewQuestion() {
  console.log("New question started");
  isRoundFinished = false;
  currentQuestion = await retrieveRandomQuestion();
  if (currentQuestion == null) return;
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

function addNewQuestion(newQuestion) {
  console.log("New question received from admin page, prompt is " + newQuestion.prompt + ", answer is " + newQuestion.answer);
  const name = newQuestion.answer.split(" ").join("_")

  const question = {
    "name": name,
    "prompt": newQuestion.prompt,
    "answer": newQuestion.answer
  }
  //insertObjectIntoDB("questions", question);
  generateStableImages(newQuestion.prompt, newQuestion.image);
  // const images = {
  //   "name": name,
  //   "images": newQuestion.images
  // }
  // insertObjectIntoDB("images", images);
}


function generateStableImages(prompt, base64Image) {
  var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  //base64Image = base64Image.replace("data:image/png;base64,", "");
  //base64Image = base64Image.trim();

  var payload = {
    "init_images":[base64Image],
    "resize_mode": 0,
    "denoising_strength": 0.75,
    "mask_blur": 4,
    "inpainting_fill": 0,
    "inpaint_full_res": true,
    "inpaint_full_res_padding": 0,
    "inpainting_mask_invert": 0,
    "prompt" : "hello",
    "styles": [

    ],
    "seed": -1,
    "subseed": -1,
    "subseed_strength": 0,
    "seed_resize_from_h": -1,
    "seed_resize_from_w": -1,
    "sampler_name": "Euler a",
    "batch_size": 1,
    "n_iter": 1,
    "steps": 20,
    "cfg_scale": 7,
    "width": 64,
    "height": 64,
    "restore_faces": false,
    "tiling": false,
    "negative_prompt": "",
    "eta": 0,
    "s_churn": 0,
    "s_tmax": 0,
    "s_tmin": 0,
    "s_noise": 1,
    "override_settings": {},
    "sampler_index": "0",
    "include_init_images": false
  }

  const req = http.request(stableServer, (res) => {
    console.log("Response from sdapi");
    res.on("data", (data) => {
      var jsonString = Buffer.from(data).toString();
      //jsonString = jsonString.replace(/\\/g, "");
      //jsonString = jsonString.replaceAll("\"", "'");
      const jsonObject = JSON.parse(jsonString);
      console.log(jsonObject.images.length);
    });
  });


  req.on('error', (error) => {
    // handle any error that occurs while making the request
    console.error("sdapi return error");
    console.error(error);
  });

  req.write(JSON.stringify(payload));
  req.end();
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
  //console.log("Inserting object " + JSON.stringify(object) + " into collection " + collection)
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
  if (result != null) {
    return result.images;
  } else {
    return [];
  }
}

//Utilities

//ES7 way to wait
//await timer(3000)
const timer = ms => new Promise(res => setTimeout(res, ms))












// Import the 'fs' and 'path' modules
const fs = require('fs');
const path = require('path');
const { NONAME } = require('dns');

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
