const WebSocket = require("ws");
const fs = require("fs");
const Filter = require("bad-words");

const filter = new Filter();
filter.addWords(
  "cazzo", "merda", "stronzo", "vaffanculo", "porco", "puttana",
  "troia", "bastardo", "culo", "minchia", "dio", "cristo", "madonna",
  "gesù", "bestemmia1", "bestemmia2"
);

const parole = []; // [{ text: "ciao", offensive: false }, {...}]

wss.on("connection", (ws) => {
  console.log("Client connesso");

  // Manda l'intera lista all'inizio
  ws.send(JSON.stringify(parole));

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

    // Invia la nuova lista a tutti i client
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(parole));
      }
    });
  });
});
