const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const { parseNomeArquivo, FILIAIS_VALIDAS, INDUSTRIAS } = require("./parser");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const WATCH_DIR = process.env.WATCH_DIR || path.join(__dirname, "watch");
const STATUS_PATH = process.env.STATUS_PATH || path.join(DATA_DIR, "status.json");

function getPaths() {
  return {
    DATA_DIR,
    WATCH_DIR,
    STATUS_PATH,
  };
}

function garantirEstrutura() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(WATCH_DIR)) {
    fs.mkdirSync(WATCH_DIR, { recursive: true });
  }

  if (!fs.existsSync(STATUS_PATH)) {
    fs.writeFileSync(STATUS_PATH, "{}", "utf-8");
  }
}

function carregarStatus() {
  garantirEstrutura();

  try {
    const raw = fs.readFileSync(STATUS_PATH, "utf-8");
    return JSON.parse(raw || "{}");
  } catch (error) {
    console.error("Erro ao ler status.json:", error);
    return {};
  }
}

function salvarStatus(status) {
  garantirEstrutura();
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

  FILIAIS_VALIDAS.forEach((filial) => {
    linha.precos[filial] = { atualizado: false, mes: null };
    linha.pendencias[filial] = { atualizado: false, mes: null };
  });

  return linha;
}

function criarStatusBase() {
  const status = {};

  INDUSTRIAS.forEach((item, index) => {
    status[item.nome] = criarLinhaVazia(item.nome, item.codigo, index);
  });

  return status;
}

function criarSeedInicial() {
  const status = criarStatusBase();
  salvarStatus(status);
  return status;
}

function marcarTodasFiliais(linha, tipo, mesAno) {
  FILIAIS_VALIDAS.forEach((filial) => {
    linha[tipo][filial] = { atualizado: true, mes: mesAno };
  });
}

function marcarSomenteFiliais(linha, tipo, filiais, mesAno) {
  filiais.forEach((filial) => {
    linha[tipo][filial] = { atualizado: true, mes: mesAno };
  });
}

function montarStatusAPartirDosArquivos() {
  garantirEstrutura();

  const status = criarStatusBase();
  const arquivos = fs.readdirSync(WATCH_DIR);

  arquivos.forEach((nomeArquivo) => {
    const caminhoCompleto = path.join(WATCH_DIR, nomeArquivo);

    try {
      const stat = fs.statSync(caminhoCompleto);
      if (!stat.isFile()) return;
    } catch (error) {
      return;
    }

    const info = parseNomeArquivo(nomeArquivo);

    if (!info) {
      return;
    }

    if (!status[info.industria]) {
      const ordemBase = INDUSTRIAS.findIndex((i) => i.nome === info.industria);

      status[info.industria] = criarLinhaVazia(
        info.industria,
        info.codigo ?? null,
        ordemBase >= 0 ? ordemBase : 999999
      );
    }

    const tipo = info.tipo || "precos";

    if (info.filiais.length > 0) {
      marcarSomenteFiliais(status[info.industria], tipo, info.filiais, info.mesAno);
    } else {
      marcarTodasFiliais(status[info.industria], tipo, info.mesAno);
    }
  });

  salvarStatus(status);
  return status;
}

function iniciarWatcher(io, options = {}) {
  const { onStatusChange } = options;

  garantirEstrutura();

  let status = montarStatusAPartirDosArquivos();

  if (onStatusChange) {
    onStatusChange(status);
  }

  console.log("Monitorando pasta:", WATCH_DIR);
  console.log("Salvando status em:", STATUS_PATH);

  const watcher = chokidar.watch(WATCH_DIR, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 1500,
      pollInterval: 100,
    },
    ignored: [/(^|[\/\\])\../, /~\$/],
  });

  function recalcularStatus(motivo, filePath) {
    try {
      status = montarStatusAPartirDosArquivos();

      if (onStatusChange) {
        onStatusChange(status);
      }

      if (io) {
        io.emit("status-atualizado", status);
      }

      const nomeArquivo = filePath ? path.basename(filePath) : "(sem arquivo)";
      console.log(`Status recalculado por ${motivo}: ${nomeArquivo}`);
    } catch (error) {
      console.error(`Erro ao recalcular status em ${motivo}:`, error);
    }
  }

  watcher.on("add", (filePath) => recalcularStatus("add", filePath));
  watcher.on("change", (filePath) => recalcularStatus("change", filePath));
  watcher.on("unlink", (filePath) => recalcularStatus("unlink", filePath));

  watcher.on("error", (error) => {
    console.error("Erro no watcher:", error);
  });

  return watcher;
}

module.exports = {
  iniciarWatcher,
  carregarStatus,
  criarSeedInicial,
  getPaths,
};