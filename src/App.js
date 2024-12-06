import React, { useState } from "react";
import "./App.css";

const App = () => {
  const [gameId, setGameId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [ws, setWs] = useState(null);
  const [players, setPlayers] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [winner, setWinner] = useState("");

  const createGame = async () => {
    const response = await fetch("http://localhost:3001/create-game", {
      method: "POST",
    });
    const data = await response.json();
    setGameId(data.gameId);
    connectWebSocket(data.gameId);
  };

  const joinGame = async () => {
    const response = await fetch("http://localhost:3001/join-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, playerName }),
    });

    if (response.ok) {
      connectWebSocket(gameId);
    } else {
      alert("Erreur lors de la connexion à la partie");
    }
  };

  const connectWebSocket = (id) => {
    const socket = new WebSocket(`ws://localhost:3001`);
    socket.onopen = () => {
      console.log("WebSocket connected");
      setWs(socket);

      socket.send(
        JSON.stringify({
          action: "join",
          gameId: id,
          playerName,
        })
      );
    };

    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);

      if (data.action === "winner") {
        setWinner(data.winner);
      }

      if (data.feedback) {
        setFeedback(data.feedback);
      }

      if (data.players) {
        setPlayers(data.players);
      }

      if (data.guess) {
        setGuesses((prevGuesses) => [
          ...prevGuesses,
          {
            guess: data.guess,
            feedback: data.feedback,
            playerName: data.playerName,
          },
        ]);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  };

  const handleGuess = () => {
    if (!ws) {
      console.error("WebSocket non connecté");
      alert("Erreur : vous n'êtes pas connecté au serveur !");
      return;
    }

    ws.send(
      JSON.stringify({
        action: "guess",
        gameId,
        guess: feedback,
        playerName,
      })
    );
  };

  return (
    <div className="app-container">
      <div className="form-container">
        <h2>Bienvenue dans le jeu !</h2>
        {!gameId ? (
          <div>
            <input
              type="text"
              placeholder="Entrez votre pseudo"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <br />
            <button onClick={createGame}>Créer une Partie</button>
            <input
              type="text"
              placeholder="ID de Partie"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
            <button onClick={joinGame}>Rejoindre</button>
          </div>
        ) : (
          <div>
            <p>
              <strong>Room ID : {gameId}</strong>
            </p>
            <input
              type="number"
              placeholder="Votre tentative"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <button onClick={handleGuess}>Deviner</button>
          </div>
        )}
      </div>

      {players.length > 0 && (
        <div className="players-container">
          <h3>Joueurs :</h3>
          <ul>
            {players.map((player, index) => (
              <li key={index}>{player}</li>
            ))}
          </ul>
        </div>
      )}

      {guesses.length > 0 && (
        <div className="guesses-container">
          <h3>Historique des tentatives :</h3>
          <ul>
            {guesses.map((guess, index) => (
              <li
                key={index}
                className={guess.feedback === "correct" ? "winner" : ""}
              >
                {guess.playerName}: {guess.guess} - {guess.feedback}
              </li>
            ))}
          </ul>
        </div>
      )}

      {winner && (
        <div className="winner-banner">
          Félicitations {winner}, tu as gagné !
        </div>
      )}
    </div>
  );
};

export default App;
