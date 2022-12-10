// Connect to the socket.io server
const socket = io();

// Get a reference to the form and its elements
const formQuestion = document.getElementById('formQuestion');
const imageInput = document.getElementById('image');
const text1Input = document.getElementById('myText1');
const text2Input = document.getElementById('myText2');
const confirmation = document.getElementById('confirmation');

var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

formQuestion.addEventListener('submit', (event) => {
    event.preventDefault();

    const image = document.getElementById("images").files[0];
    const prompt = document.getElementById("prompt").value.toLowerCase().trim();
    const answer = document.getElementById("answer").value.toLowerCase().trim();
    //const bonusAnswers = document.getElementById("prompt").value;

    let reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onload = () => {
        var base64Image = reader.result;
        //base64Image = base64Image.split(",")[1]
        //const paddedBase64String = base64Image.padEnd(base64Image.length + (4 - base64Image.length % 4) % 4, '=');

        console.log("New question sent, prompt is "+prompt+", answer is "+answer);
        socket.emit('newQuestion', {
            "image": base64Image,
            "prompt": prompt,
            "answer": answer
        });
    };


});

// Listen for the form's submit event
// formQuestion.addEventListener('submit', (event) => {
//     // Prevent the default form submission behavior
//     event.preventDefault();

//     const images = document.getElementById("images").files;
//     const prompt = document.getElementById("prompt").value.toLowerCase().trim();
//     const answer = document.getElementById("answer").value.toLowerCase().trim();
//     //const bonusAnswers = document.getElementById("prompt").value;

//     let base64Images = [];
//     console.log(images.length + " images submitted");
//     for (let i = 0; i < images.length; i++) {
//         let reader = new FileReader();
//         reader.readAsDataURL(images[i]);
//         reader.onload = () => {
//             base64Images.push(reader.result);
//             if (base64Images.length === images.length) {
//                 console.log("New question sent, containing "+base64Images.length+" images, prompt is "+prompt+", answer is "+answer);
//                 // send images when everything has been pushed to bas64 array
//                 socket.emit('newQuestion', {
//                     "images": base64Images,
//                     "prompt": prompt,
//                     "answer": answer
//                 });
//             }
//         };
//     }

// });

