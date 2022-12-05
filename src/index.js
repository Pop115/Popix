const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public/'));
app.use('/socketio', express.static('node_modules/socket.io/client-dist/'));

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.get('/admin', (req, res) => {
  res.sendFile('admin/admin.html', { root: "public/" });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});


io.on('connection', socket => {
  console.log('A user connected');

  socket.on("set-pseudo", (pseudo) => {
    console.log("User connected and set its pseudo to " + pseudo);
    io.emit("add-player", pseudo)
  });

  socket.on('message', message => {
    console.log(`Received message: ${message}`);
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

  socket.on("generate64", (questionName, directoryPath) => {
    convertPicturesFromDirectory(questionName, directoryPath);
  });
});

async function loadImagesByTag(tag) {
  // Connect to the database
  const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true });
  const db = client.db(dbName);

  // Find all images with the specified tag
  const images = await db.collection('images').find({ tags: tag }).toArray();

  // Close the database connection
  client.close();

  // Return the list of images
  return images;
}



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

    console.log(name);
    console.log(index);

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


/*
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
.
async function uploadImages(req, res) {
  // Get the list of uploaded images
  const images = req.files;

  // Get the tag for the images from the request body
  const tag = req.body.tag;

  // Connect to the database
  const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true });
  const db = client.db(dbName);

  // Insert the images into the database
  for (const image of images) {
    await db.collection('images').insertOne({
      data: image.buffer,
      contentType: image.mimetype,
      tags: [tag]
    });
  }

  // Close the database connection
  client.close();

  // Send a response to the client
  res.send('Images uploaded successfully');
}
*/




const MongoClient = require('mongodb').MongoClient;


const dbClient = new MongoClient('mongodb://127.0.0.1:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const dbName = 'popix';

dbClient.connect((err) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log('Connected to MongoDB server');
});

async function insertObjectIntoDB(collection, object) {
  console.log("Inserting object " + object + " into collection " + collection)
  const db = dbClient.db(dbName).collection(collection);
  const result = await db.insertOne(object);

}


