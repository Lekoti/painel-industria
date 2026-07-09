const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const {
  iniciarWatcher,
  carregarStatus,
  criarSeedInicial,
} = require("./watcher");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://SEU-FRONTEND-REAL.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Backend online",
    endpoints: ["/health", "/status"],
  });
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
  console.log(`Backend rodando na porta ${PORTA}`);
});