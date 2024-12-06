const express = require("express");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const cors = require("cors");
const gameManager = require("./game");

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const message = JSON.parse(data);
    const response = gameManager.handleMessage(message, ws);
    if (response) {
      ws.send(JSON.stringify(response));
    }
  });
});

// Routes API
app.post("/create-game", (_req, res) => {
  const gameId = gameManager.createGame();
  res.json({ gameId });
});

app.post("/join-game", (req, res) => {
  const { gameId } = req.body;
  const joined = gameManager.joinGame(gameId);
  if (joined) {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Game not found or full" });
  }
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
