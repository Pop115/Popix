// Connect to the socket.io server
const socket = io();

// Get a reference to the form and its elements
const formQuestion = document.getElementById('formQuestion');
const imageInput = document.getElementById('image');
const text1Input = document.getElementById('myText1');
const text2Input = document.getElementById('myText2');
const confirmation = document.getElementById('confirmation');

// Listen for the form's submit event
formQuestion.addEventListener('submit', (event) => {
  // Prevent the default form submission behavior
  event.preventDefault();

  // Read the image file and convert it to a base64-encoded string
  const reader = new FileReader();
  reader.readAsDataURL(imageInput.files[0]);
  reader.onload = () => {
    // Create an object with the form data
    const data = {
      image: reader.result,
      text1: text1Input.value,
      text2: text2Input.value,
    };

    // Emit the formData event to the server with the data object
    socket.emit('formData', data);
  };
});

const form64 = document.getElementById('form64');
const directoryInput = document.getElementById('directoryInput');
const questionNameInput = document.getElementById('questionName');

form64.addEventListener('submit', (event) => {
  event.preventDefault();

  const directoryPath = directoryInput.value;
  const questionName = questionNameInput.value;
  socket.emit('generate64', questionName, directoryPath);
});

// Listen for the confirmation event from the server
socket.on('confirmation', (message) => {
  // Display the confirmation message
  confirmation.innerHTML = message;
});