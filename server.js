// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const Filter = require("bad-words");


const filter = new Filter();
filter.addWords(
  "cazzo", "merda", "stronzo", "vaffanculo", "porco", "puttana",
  "troia", "bastardo", "culo", "minchia", "dio", "cristo", "madonna",
  "gesù"
);

const app = express();
app.use(cors()); 

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const parole = [];

// Serve il file .txt per il download
app.get("/download", (req, res) => {
  const filePath = path.join(__dirname, "parole.txt");
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Nessun file ancora.");
  }
  res.download(filePath);
});

// Rotta per pulire tutto
app.post("/clear", (req, res) => {
  // Svuota array parole
  parole.length = 0;

  // Elimina il file parole.txt se esiste
  const filePath = path.join(__dirname, "parole.txt");
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
});

// WebSocket
wss.on("connection", (ws) => {
  console.log("Client connesso");
  ws.send(JSON.stringify(parole)); // Manda la lista completa

  ws.on("message", (msg) => {
    const parola = msg.toString().trim();
    if (!parola) return;

    const isOffensive = filter.isProfane(parola);

    const nuovaParola = {
      text: parola,
      offensive: isOffensive,
    };

    parole.push(nuovaParola);

    // Se non è offensiva, salvala nel file
    if (!isOffensive) {
      const parolePulite = parole.filter(p => !p.offensive).map(p => p.text);
      fs.writeFileSync("parole.txt", parolePulite.join("\n"));
    }

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(parole));
        }
      });

      res.status(200).json({ message: "Pulizia completata" });
      
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
