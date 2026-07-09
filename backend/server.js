const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { iniciarWatcher, carregarStatus, criarSeedInicial } = require("./watcher");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/status", (req, res) => {
  res.json(carregarStatus());
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

criarSeedInicial();
iniciarWatcher(io);

const PORTA = process.env.PORT || 3001;

server.listen(PORTA, () => {
  console.log(`Backend rodando em http://localhost:${PORTA}`);
});