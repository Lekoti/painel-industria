const express = require("express");
const cors = require("cors");
const http = require("http");
const multer = require("multer");
const { Server } = require("socket.io");
const {
  iniciarWatcher,
  carregarStatus,
  criarSeedInicial,
  aplicarArquivoAoStatus,
} = require("./watcher");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://painel-industria.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

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
    endpoints: ["/health", "/status", "/upload"],
  });
});

app.get("/status", (req, res) => {
  res.json(carregarStatus());
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/upload", upload.single("arquivo"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: "Nenhum arquivo enviado.",
      });
    }

    const resultado = aplicarArquivoAoStatus(req.file.originalname, io);

    if (!resultado.ok) {
      return res.status(400).json(resultado);
    }

    return res.json({
      ok: true,
      message: "Arquivo processado com sucesso.",
      nomeArquivo: resultado.nomeArquivo,
      industria: resultado.industria,
      tipo: resultado.tipo,
      filiais: resultado.filiais,
      mesAno: resultado.mesAno,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Erro ao processar upload.",
      detalhe: error.message,
    });
  }
});

criarSeedInicial();
iniciarWatcher(io);

const PORTA = process.env.PORT || 3001;

server.listen(PORTA, () => {
  console.log(`Backend rodando na porta ${PORTA}`);
});