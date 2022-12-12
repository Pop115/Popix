# Popix (NodeJS image quiz game)

This is a simple quiz game written in NodeJS. It uses a websocket to communicate between the server and the client. The game displays an image modified by an AI and the players have to guess the answer to earn points.

## How to run the game

1. Clone the repository and navigate to the project directory
```
git clone https://github.com/Pop115/Popix
cd popix
```

2. Install the dependencies
```
npm install
```

3. Start MongoDB on port 27017 (only supporting locally)

4. Start the game
```
node src/index.js
```

5. (Optional) Launch stable-diffusion-webui if you want to generate new images
```
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
cd stable-diffusion-webui
./webui-user.bat
```

6. Open the game in your web browser at `http://localhost:3000`

## How to play the game

1. Open the game in your web browser at `http://localhost:3000`

2. Enter your name and click "Ok"

4. When an image is displayed, type your answer in the text box and press enter

5. If your answer is correct, you will earn points and a new round will start

6. The images will progressively be closer to the original image until there are no more images left

7. The rounds continue indefinitely

## How to add new questions

1. Open the game in your web browser at `http://localhost:3000/admin`

2. Submit a picture, the prompt that will be used for stable-diffusion to generate the modified pictures and the answer to win the round

3. The images will be generated (can take a few minutes) and once all images are generated the question will be available on the game

4. If another generation is already running, your question will be added to the queue and will be processed automatically after

## Technologies used

- NodeJS
- Express
- Socket.io
- MongoDB
- html, css, javascript

## Contributing

If you want to contribute to the project, please follow these steps:

1. Fork the repository

2. Create a new branch for your changes

3. Make the necessary changes and commit them

4. Push the changes to your fork

5. Create a new pull request to the main repository

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
