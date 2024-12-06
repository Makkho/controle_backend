const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 3001;
app.use(cors());
app.use(express.json());

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

const games = {};

app.post("/create-game", (_req, res) => {
  const gameId = uuidv4();
  const mysteryNumber = Math.floor(Math.random() * 90000) + 10000;
  games[gameId] = {
    mysteryNumber,
    players: [],
    guesses: [],
    winner: null,
  };

  console.log(`Game ID: ${gameId} - Mystery Number: ${mysteryNumber}`);
  res.json({ gameId });
});

app.post("/join-game", (req, res) => {
  const { gameId, playerName } = req.body;
  if (games[gameId]) {
    games[gameId].players.push(playerName);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Game not found" });
  }
});

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    const { action, gameId, guess, playerName } = data;

    if (action === "guess" && games[gameId]) {
      const game = games[gameId];
      const mysteryNumber = game.mysteryNumber;

      let feedback;
      if (parseInt(guess) === mysteryNumber) {
        feedback = "correct";

        game.winner = playerName;

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                action: "winner",
                winner: playerName,
              })
            );
          }
        });
      } else {
        feedback = parseInt(guess) > mysteryNumber ? "lower" : "higher";
      }

      game.guesses.push({ guess, feedback, playerName });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              feedback,
              guess,
              playerName,
              players: game.players,
              winner: game.winner || null,
            })
          );
        }
      });
    }
  });
});
