const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const Filter = require("bad-words");

const app = express();
app.use(cors());

// Serve una homepage per tenere vivo Render
app.get("/", (req, res) => {
  res.send("✅ Server WebSocket attivo.");
});

// Inizializza server HTTP e WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Array per memorizzare parole ricevute
let parole = [];

// Configura filtro parolacce
const filter = new Filter();
filter.addWords(
  // parole italiane comuni da censurare
  "cazzo", "merda", "stronzo", "vaffanculo", "porco", "puttana",
  "troia", "bastardo", "culo", "minchia", "dio", "cristo", "madonna",
  "gesù", "coglione", "figa", "coglioni"
);

// Rotta per scaricare il file parole.txt
app.get("/download", (req, res) => {
  const filePath = path.join(__dirname, "parole.txt");

  if (!fs.existsSync(filePath)) {
    console.warn("❌ Richiesta download, ma file inesistente.");
    return res.status(404).send("Nessun file ancora.");
  }

  // Header CORS esplicito per sicurezza
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.download(filePath, "parole.txt", (err) => {
    if (err) {
      console.error("Errore download:", err);
      res.status(500).send("Errore durante il download.");
    }
  });
});

// WebSocket handling
wss.on("connection", (ws) => {
  console.log("🔗 Nuovo client connesso.");
  ws.send(JSON.stringify(parole)); // Manda subito l'elenco aggiornato

  ws.on("message", (msg) => {
    const parola = msg.toString().trim();
    if (!parola) return;

    const isOffensive = filter.isProfane(parola);

    const nuovaParola = {
      text: parola,
      offensive: isOffensive,
    };

    parole.push(nuovaParola);
    console.log(`📥 Ricevuta parola: "${parola}" ${isOffensive ? "(OFFENSIVA)" : ""}`);

    // Se NON è offensiva → aggiungi al file
    if (!isOffensive) {
      try {
        const filePath = path.join(__dirname, "parole.txt");
        fs.appendFileSync(filePath, parola + "\n");
      } catch (err) {
        console.error("❌ Errore durante il salvataggio su file:", err);
      }
    }

    // Aggiorna tutti i client con la nuova lista
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(parole));
      }
    });
  });
});

// Avvia il server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
});
