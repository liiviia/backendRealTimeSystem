// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors()); // 🔥 RISOLVE IL PROBLEMA DI CORS

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let parole = [];

// Serve il file .txt per il download
app.get("/download", (req, res) => {
  const filePath = path.join(__dirname, "parole.txt");
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Nessun file ancora.");
  }
  res.download(filePath);
});

// WebSocket
wss.on("connection", (ws) => {
  console.log("Client connesso");
  ws.send(JSON.stringify(parole)); // Manda la lista completa

  ws.on("message", (msg) => {
    const parola = msg.toString().trim();
    if (parola) {
      parole.push(parola);
      fs.writeFileSync("parole.txt", parole.join("\n"));
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(parole));
        }
      });
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✅ Server in ascolto sulla porta ${PORT}`);
});
