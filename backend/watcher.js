const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const { parseNomeArquivo, FILIAIS_VALIDAS, INDUSTRIAS } = require("./parser");

const DATA_DIR = path.join(__dirname, "data");
const STATUS_PATH = path.join(DATA_DIR, "status.json");

function garantirEstrutura() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
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
  } catch {
    return {};
  }
}

function salvarStatus(status) {
  garantirEstrutura();
  fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2), "utf-8");
}

function criarLinhaVazia(industria, codigo, ordem) {
  const linha = { industria, codigo, ordem, precos: {}, pendencias: {} };

  FILIAIS_VALIDAS.forEach((filial) => {
    linha.precos[filial] = { atualizado: false, mes: null };
    linha.pendencias[filial] = { atualizado: false, mes: null };
  });

  return linha;
}

function criarSeedInicial() {
  const status = carregarStatus();
  let alterou = false;

  INDUSTRIAS.forEach((item, index) => {
    if (!status[item.nome]) {
      status[item.nome] = criarLinhaVazia(item.nome, item.codigo, index);
      alterou = true;
    } else {
      if (status[item.nome].codigo !== item.codigo) {
        status[item.nome].codigo = item.codigo;
        alterou = true;
      }

      if (status[item.nome].ordem !== index) {
        status[item.nome].ordem = index;
        alterou = true;
      }

      if (!status[item.nome].precos) {
        status[item.nome].precos = {};
        alterou = true;
      }

      if (!status[item.nome].pendencias) {
        status[item.nome].pendencias = {};
        alterou = true;
      }

      FILIAIS_VALIDAS.forEach((filial) => {
        if (!status[item.nome].precos[filial]) {
          status[item.nome].precos[filial] = { atualizado: false, mes: null };
          alterou = true;
        }

        if (!status[item.nome].pendencias[filial]) {
          status[item.nome].pendencias[filial] = { atualizado: false, mes: null };
          alterou = true;
        }
      });
    }
  });

  if (alterou) salvarStatus(status);
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

function aplicarArquivoAoStatus(nomeArquivo, io) {
  const info = parseNomeArquivo(nomeArquivo);

  if (!info) {
    return {
      ok: false,
      error: `Arquivo ignorado: ${nomeArquivo}`,
    };
  }

  const status = carregarStatus();

  if (!status[info.industria]) {
    const ordemBase = INDUSTRIAS.findIndex((i) => i.nome === info.industria);
    status[info.industria] = criarLinhaVazia(
      info.industria,
      info.codigo ?? null,
      ordemBase >= 0 ? ordemBase : 999999
    );
  }

  const tipo = info.tipo || "precos";

  if (!status[info.industria][tipo]) {
    status[info.industria][tipo] = {};
  }

  FILIAIS_VALIDAS.forEach((filial) => {
    if (!status[info.industria][tipo][filial]) {
      status[info.industria][tipo][filial] = { atualizado: false, mes: null };
    }
  });

  if (info.filiais.length > 0) {
    marcarSomenteFiliais(status[info.industria], tipo, info.filiais, info.mesAno);
  } else {
    marcarTodasFiliais(status[info.industria], tipo, info.mesAno);
  }

  salvarStatus(status);

  if (io) {
    io.emit("status-atualizado", status);
  }

  return {
    ok: true,
    nomeArquivo,
    industria: info.industria,
    tipo,
    filiais: info.filiais,
    mesAno: info.mesAno,
    status,
  };
}

function iniciarWatcher(io) {
  const pastaWatch = path.join(__dirname, "watch");

  if (!fs.existsSync(pastaWatch)) {
    fs.mkdirSync(pastaWatch, { recursive: true });
  }

  criarSeedInicial();

  const watcher = chokidar.watch(pastaWatch, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 1500,
      pollInterval: 100,
    },
    ignored: [/^\./, /node_modules/],
  });

  watcher.on("add", (filePath) => {
    const nomeArquivo = path.basename(filePath);
    const resultado = aplicarArquivoAoStatus(nomeArquivo, io);

    if (!resultado.ok) {
      console.log(resultado.error);
      return;
    }

    console.log(
      `Arquivo processado: ${resultado.nomeArquivo} -> ${resultado.industria} (${resultado.tipo})`
    );
  });

  return watcher;
}

module.exports = {
  iniciarWatcher,
  carregarStatus,
  criarSeedInicial,
  aplicarArquivoAoStatus,
};