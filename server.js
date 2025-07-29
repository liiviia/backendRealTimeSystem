const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let parole = []; // array cronologico

// Serve parole.txt come file scaricabile
app.get("/download", (req, res) => {
  const filePath = path.join(__dirname, "parole.txt");
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send("File non trovato");
  }
});

wss.on("connection", (ws) => {
  console.log("Client connesso");

  // Invia tutte le parole finora al nuovo client
  ws.send(JSON.stringify(parole));

  ws.on("message", (message) => {
    const parola = message.toString().trim();
    if (!parola) return;

    parole.push(parola);

    // Scrivi su file in ordine
    fs.writeFileSync("parole.txt", parole.join("\n"));

    // Invia a tutti i client la lista aggiornata
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(parole));
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnesso");
  });
});

server.listen(PORT, () => {
  console.log(` Server in ascolto sulla porta ${PORT}`);
});
