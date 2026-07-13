const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const { parseNomeArquivo, INDUSTRIAS } = require("./parser");

const FILIAIS = ["DPR", "AMS", "DMT", "DMS", "DSC"];
const STATUS_PATH = path.join(__dirname, "data", "status.json");
const WATCH_PATH = path.join(__dirname, "watch");

function carregarStatus() {
  if (!fs.existsSync(STATUS_PATH)) return {};
  try {
    const raw = fs.readFileSync(STATUS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function salvarStatus(status) {
  fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2), "utf-8");
}

function criarLinhaVazia(industria, codigo, ordem) {
  const linha = {
    industria,
    codigo,
    ordem,
    precos: {},
    pendencias: {},
  };

  FILIAIS.forEach((filial) => {
    linha.precos[filial] = { atualizado: false, mes: null };
    linha.pendencias[filial] = { atualizado: false, mes: null };
  });

  return linha;
}

function criarSeedInicial() {
  const status = {};

  INDUSTRIAS.forEach((item, index) => {
    status[item.nome] = criarLinhaVazia(item.nome, item.codigo, index);
  });

  return status;
}

function garantirLinha(status, info) {
  if (!status[info.industria]) {
    const ordemBase = INDUSTRIAS.findIndex((i) => i.nome === info.industria);
    status[info.industria] = criarLinhaVazia(
      info.industria,
      info.codigo ?? null,
      ordemBase >= 0 ? ordemBase : 999999
    );
  }

  if (info.codigo != null && !status[info.industria].codigo) {
    status[info.industria].codigo = info.codigo;
  }

  return status[info.industria];
}

function marcarTodasFiliais(linha, tipo, mesAno) {
  FILIAIS.forEach((filial) => {
    linha[tipo][filial] = { atualizado: true, mes: mesAno };
  });
}

function marcarSomenteFiliais(linha, tipo, filiais, mesAno) {
  filiais.forEach((filial) => {
    linha[tipo][filial] = { atualizado: true, mes: mesAno };
  });
}

function listarArquivosDaPasta(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(dir, entry.name));
}

function recalcularStatusCompleto() {
  const status = criarSeedInicial();
  const arquivos = listarArquivosDaPasta(WATCH_PATH);

  arquivos.forEach((filePath) => {
    const nomeArquivo = path.basename(filePath);
    const info = parseNomeArquivo(nomeArquivo);

    if (!info) {
      console.log("Arquivo ignorado:", nomeArquivo);
      return;
    }

    const linha = garantirLinha(status, info);
    const tipo = info.tipo || "precos";

    if (info.filiais && info.filiais.length > 0) {
      marcarSomenteFiliais(linha, tipo, info.filiais, info.mesAno);
    } else {
      marcarTodasFiliais(linha, tipo, info.mesAno);
    }
  });

  salvarStatus(status);
  return status;
}

function getPaths() {
  return {
    statusPath: STATUS_PATH,
    watchPath: WATCH_PATH,
  };
}

function iniciarWatcher(io, options = {}) {
  if (!fs.existsSync(WATCH_PATH)) {
    fs.mkdirSync(WATCH_PATH, { recursive: true });
  }

  const { onStatusChange } = options;
  let timeoutRebuild = null;

  const emitirStatusAtualizado = () => {
    const status = recalcularStatusCompleto();

    if (typeof onStatusChange === "function") {
      onStatusChange(status);
    }

    if (io) {
      io.emit("status-atualizado", status);
    }

    console.log("Status recalculado com sucesso.");
  };

  const reagendarRebuild = () => {
    if (timeoutRebuild) clearTimeout(timeoutRebuild);
    timeoutRebuild = setTimeout(() => {
      emitirStatusAtualizado();
    }, 1200);
  };

  emitirStatusAtualizado();

  const watcher = chokidar.watch(WATCH_PATH, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 1500,
      pollInterval: 100,
    },
    ignored: /(^|[\/\\])\../,
  });

  watcher.on("add", (filePath) => {
    console.log("Arquivo adicionado:", path.basename(filePath));
    reagendarRebuild();
  });

  watcher.on("change", (filePath) => {
    console.log("Arquivo alterado:", path.basename(filePath));
    reagendarRebuild();
  });

  watcher.on("unlink", (filePath) => {
    console.log("Arquivo removido:", path.basename(filePath));
    reagendarRebuild();
  });

  watcher.on("ready", () => {
    console.log("Watcher pronto.");
    reagendarRebuild();
  });

  watcher.on("error", (error) => {
    console.error("Erro no watcher:", error);
  });

  return watcher;
}

module.exports = {
  iniciarWatcher,
  carregarStatus,
  criarSeedInicial: recalcularStatusCompleto,
  getPaths,
};