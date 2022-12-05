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

