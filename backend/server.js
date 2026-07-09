const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const {
  iniciarWatcher,
  criarSeedInicial,
  carregarStatus,
  getPaths,
} = require("./watcher");

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

let statusAtual = criarSeedInicial();

app.get("/status", (req, res) => {
  res.json(statusAtual);
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    industrias: Object.keys(statusAtual || {}).length,
  });
});

app.get("/debug", (req, res) => {
  const statusDisco = carregarStatus();
  const paths = getPaths();

  res.json({
    ok: true,
    memoria: Object.keys(statusAtual || {}).length,
    disco: Object.keys(statusDisco || {}).length,
    socketClientes: io.engine.clientsCount,
    paths,
    ambiente: process.env.NODE_ENV || "development",
  });
});

iniciarWatcher(io, {
  onStatusChange: (novoStatus) => {
    statusAtual = novoStatus;
  },
});

const PORTA = process.env.PORT || 3001;

server.listen(PORTA, () => {
  console.log(`Backend rodando em http://localhost:${PORTA}`);
});