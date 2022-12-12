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

3. Start the game
```
node src/index.js
```

4. Open the game in your web browser at `http://localhost:3000`

## How to play the game

1. Open the game in your web browser at `http://localhost:3000`

2. Enter your name and click "Play"

3. Wait for the game to start

4. When a question is displayed, type your answer in the text box and press enter

5. If your answer is correct, you will earn points and a new round will start

6. The game continues until all the questions have been answered

## How to add new questions

1. Open the game in your web browser at `http://localhost:3000/admin`

2. Type your question and answer in the text boxes and click "Add"

3. The new question will be added to the game and will be displayed in the next round

## Technologies used

- NodeJS
- Express
- Socket.io
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
