const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const server = require('http').createServer();
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', (ws) => {
  console.log("Client connesso");
  clients.push(ws);

  ws.on('message', (message) => {
    console.log("Parola ricevuta:", message.toString());

    // Inoltra a tutti gli altri client
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => {
    console.log("Client disconnesso");
    clients = clients.filter(c => c !== ws);
  });
});

server.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
