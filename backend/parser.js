const path = require("path");

const FILIAIS_VALIDAS = ["DPR", "AMS", "DMT", "DMS", "DSC"];

const MESES = {
  JANEIRO: 1,
  FEVEREIRO: 2,
  MARCO: 3,
  ABRIL: 4,
  MAIO: 5,
  JUNHO: 6,
  JULHO: 7,
  AGOSTO: 8,
  SETEMBRO: 9,
  OUTUBRO: 10,
  NOVEMBRO: 11,
  DEZEMBRO: 12,
};

const INDUSTRIAS = [
  { codigo: 39, nome: "CIFARMA", aliases: ["CIFARMA FARMA", "CIFARMA PROPAGANDA MEDICA"] },
  { codigo: 180, nome: "ECOFITUS", aliases: [] },
  { codigo: 56, nome: "EMS", aliases: [] },
  { codigo: 875, nome: "EMS GENERICO", aliases: [] },
  { codigo: 60, nome: "EUROFARMA", aliases: [] },
  { codigo: 9, nome: "GEOLAB", aliases: [] },
  { codigo: 68, nome: "KLEY HERTZ", aliases: [] },
  { codigo: 4, nome: "LEGRAND GENERICOS", aliases: [] },
  { codigo: 2, nome: "LEGRAND TARJADOS", aliases: [] },
  { codigo: 193, nome: "MAXINUTRI", aliases: [] },
  { codigo: 8, nome: "MULTILAB", aliases: [] },
  { codigo: 85, nome: "NATULAB", aliases: [] },
  { codigo: 5, nome: "NEO QUIMICA GENERICO", aliases: [] },
  { codigo: 1, nome: "NEO QUIMICA SMART", aliases: [] },
  { codigo: 3, nome: "TEUTO", aliases: [] },
  { codigo: 118, nome: "VITAMEDIC", aliases: [] },
  { codigo: 778, nome: "3B", aliases: [] },
  { codigo: 750, nome: "ABOVE", aliases: [] },
  { codigo: 10, nome: "ACCUMED", aliases: [] },
  { codigo: 11, nome: "ADDIT", aliases: [] },
  { codigo: 12, nome: "ADV LAB TAYUYNA", aliases: ["ADV"] },
  { codigo: 231, nome: "AIRELA", aliases: [] },
  { codigo: 882, nome: "ALPHAFITUS CREATINA", aliases: [] },
  { codigo: 909, nome: "AMAKHA PARIS", aliases: [] },
  { codigo: 15, nome: "ANALITIC", aliases: [] },
  { codigo: 18, nome: "ARTE NATIVA VELTOFARMA", aliases: [] },
  { codigo: 873, nome: "AVIZOR", aliases: [] },
  { codigo: 863, nome: "AVVIO", aliases: [] },
  { codigo: 868, nome: "BEIRA ALTA", aliases: [] },
  { codigo: 169, nome: "BELFAR", aliases: [] },
  { codigo: 859, nome: "BELLAPHYTUS", aliases: [] },
  { codigo: 24, nome: "BIONATUS", aliases: [] },
  { codigo: 28, nome: "BRASTERAPICA", aliases: [] },
  { codigo: 779, nome: "BREYER", aliases: [] },
  { codigo: 31, nome: "BUTTERFLY", aliases: [] },
  { codigo: 32, nome: "C M HOSPITALAR", aliases: [] },
  { codigo: 742, nome: "CARTA FABRIL", aliases: [] },
  { codigo: 34, nome: "CATARINENSE", aliases: [] },
  { codigo: 35, nome: "CATARINENSE MATACURA", aliases: [] },
  { codigo: 36, nome: "CAZI", aliases: [] },
  { codigo: 843, nome: "CCM", aliases: [] },
  { codigo: 49, nome: "CELLERA DELTA", aliases: [] },
  { codigo: 179, nome: "CIFARMA PROPAGANDA MEDICA", aliases: ["CIFARMA FARMA"] },
  { codigo: 40, nome: "CIMED", aliases: [] },
  { codigo: 41, nome: "CIRURGICA FERNANDES", aliases: [] },
  { codigo: 724, nome: "COMERCIO E DISTRIBUIDORA DELTA", aliases: [] },
  { codigo: 44, nome: "CREMER", aliases: [] },
  { codigo: 46, nome: "DKT", aliases: [] },
  { codigo: 893, nome: "DACOLONIA", aliases: [] },
  { codigo: 865, nome: "DENTAL CLEAN", aliases: [] },
  { codigo: 53, nome: "DIVON", aliases: [] },
  { codigo: 54, nome: "DORJA", aliases: [] },
  { codigo: 889, nome: "DR PEANUT", aliases: [] },
  { codigo: 894, nome: "DRICA", aliases: [] },
  { codigo: 61, nome: "E DE SOU TUBOS CIRUR RINELC", aliases: [] },
  { codigo: 57, nome: "EQUIPLEX", aliases: [] },
  { codigo: 869, nome: "ESCOBEL", aliases: [] },
  { codigo: 160, nome: "ESSITY FRALDAS TENA", aliases: [] },
  { codigo: 784, nome: "FARMACE", aliases: [] },
  { codigo: 65, nome: "FARMAX", aliases: [] },
  { codigo: 886, nome: "FLOPI", aliases: [] },
  { codigo: 878, nome: "GIOVANNA BABY PRO NOVA", aliases: [] },
  { codigo: 122, nome: "GLOBO", aliases: [] },
  { codigo: 184, nome: "GREENPHARMA", aliases: [] },
  { codigo: 786, nome: "GUM SUNSTAT", aliases: [] },
  { codigo: 107, nome: "HADASS RIVICA TROL", aliases: [] },
  { codigo: 832, nome: "HEALTHY", aliases: [] },
  { codigo: 67, nome: "HEARST", aliases: [] },
  { codigo: 913, nome: "HERBISSIMO", aliases: [] },
  { codigo: 71, nome: "IFAL", aliases: [] },
  { codigo: 72, nome: "IMEC", aliases: [] },
  { codigo: 73, nome: "INBORPLAS", aliases: [] },
  { codigo: 74, nome: "INCOTERM", aliases: [] },
  { codigo: 75, nome: "INJEX", aliases: [] },
  { codigo: 130, nome: "INSTITUTO KRONER", aliases: [] },
  { codigo: 615, nome: "JD DISTRIBUIDORA", aliases: [] },
  { codigo: 885, nome: "KATIGUA", aliases: [] },
  { codigo: 864, nome: "KUKA", aliases: [] },
  { codigo: 860, nome: "LABOTRAT", aliases: [] },
  { codigo: 903, nome: "LABPHARMA", aliases: [] },
  { codigo: 872, nome: "LILLO", aliases: [] },
  { codigo: 870, nome: "LOLLY", aliases: [] },
  { codigo: 79, nome: "MAKROFARMA", aliases: [] },
  { codigo: 768, nome: "MALAVASI", aliases: [] },
  { codigo: 787, nome: "MARJAN", aliases: [] },
  { codigo: 890, nome: "MAXTITANIUM", aliases: [] },
  { codigo: 195, nome: "MEDINAL", aliases: [] },
  { codigo: 80, nome: "MEDIX", aliases: [] },
  { codigo: 726, nome: "MEDLEY", aliases: [] },
  { codigo: 82, nome: "MEDQUIMICA", aliases: [] },
  { codigo: 136, nome: "MELPOEJO", aliases: [] },
  { codigo: 137, nome: "MERHEJE", aliases: [] },
  { codigo: 199, nome: "MINANCORA", aliases: [] },
  { codigo: 83, nome: "MISSNER", aliases: [] },
  { codigo: 735, nome: "MOVA MIDIAN", aliases: [] },
  { codigo: 201, nome: "MULTILASER", aliases: [] },
  { codigo: 908, nome: "NATCOFARMA", aliases: [] },
  { codigo: 405, nome: "NATIVITA", aliases: [] },
  { codigo: 771, nome: "NATU HAIR", aliases: [] },
  { codigo: 854, nome: "NEOBEM AGAPLAST", aliases: [] },
  { codigo: 738, nome: "NEOPAN", aliases: [] },
  { codigo: 89, nome: "NORTE SUL", aliases: [] },
  { codigo: 144, nome: "NTL", aliases: [] },
  { codigo: 93, nome: "OMRON", aliases: [] },
  { codigo: 881, nome: "ORA PRO NOBIS", aliases: [] },
  { codigo: 96, nome: "OSORIO DE MORAES", aliases: [] },
  { codigo: 97, nome: "PEROSUL", aliases: [] },
  { codigo: 147, nome: "PHARLAB", aliases: [] },
  { codigo: 99, nome: "PHARMASCIENCE", aliases: [] },
  { codigo: 884, nome: "POLIBRINQ BRINQUEDOS", aliases: [] },
  { codigo: 100, nome: "PONTELAND", aliases: [] },
  { codigo: 149, nome: "PRATI", aliases: [] },
  { codigo: 891, nome: "PROBIOTICA", aliases: [] },
  { codigo: 150, nome: "PROLIFE", aliases: [] },
  { codigo: 777, nome: "PROMEL", aliases: [] },
  { codigo: 879, nome: "QUALYBLESS", aliases: ["QUALYBLESS MUMBABY"] },
  { codigo: 905, nome: "QUALYNUTRI", aliases: [] },
  { codigo: 104, nome: "RANBAXY", aliases: [] },
  { codigo: 106, nome: "RIOQUIMICA", aliases: [] },
  { codigo: 900, nome: "RUGOL", aliases: [] },
  { codigo: 109, nome: "SANFARMA", aliases: [] },
  { codigo: 110, nome: "SANIBRAS", aliases: [] },
  { codigo: 727, nome: "SANOFI", aliases: [] },
  { codigo: 111, nome: "SOBRAL", aliases: [] },
  { codigo: 823, nome: "SPK", aliases: [] },
  { codigo: 888, nome: "TURMA DA MONICA", aliases: [] },
  { codigo: 161, nome: "TUTTICARE", aliases: [] },
  { codigo: 822, nome: "UNIPHAR J R D", aliases: [] },
  { codigo: 880, nome: "VCA", aliases: [] },
  { codigo: 116, nome: "VIDORA", aliases: [] },
  { codigo: 744, nome: "VITAFOR", aliases: [] },
  { codigo: 117, nome: "VITAMED", aliases: [] },
  { codigo: 69, nome: "WALDOMIRO PEREIRA", aliases: [] },
  { codigo: 119, nome: "WESP", aliases: [] },
  { codigo: 167, nome: "ZIIN ZIIN", aliases: [] },
  { codigo: 168, nome: "ZYDUS", aliases: [] },
  { codigo: 63, nome: "FARMABRAZ PASSAJA", aliases: [] },
  { codigo: 906, nome: "PRINCIPIA ES", aliases: [] },
];

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

const MAPA_INDUSTRIAS = {};
for (const item of INDUSTRIAS) {
  MAPA_INDUSTRIAS[normalizarTexto(item.nome)] = item;
  for (const alias of item.aliases || []) {
    MAPA_INDUSTRIAS[normalizarTexto(alias)] = item;
  }
}

function removerExtensao(nomeArquivo) {
  return path.basename(nomeArquivo, path.extname(nomeArquivo));
}

function extrairFiliaisDeTokens(tokens) {
  return tokens.filter((t) => FILIAIS_VALIDAS.includes(normalizarTexto(t)));
}

function parseNomeArquivo(nomeArquivo) {
  const base = removerExtensao(nomeArquivo);
  const tokensOriginais = base.split(/\s+/).filter(Boolean);
  const tokens = tokensOriginais.map(normalizarTexto);

  if (!tokens.length) return null;

  const tipoToken = tokens[0];
  let tipo = null;

  if (tipoToken === "PRECOS") tipo = "precos";
  if (tipoToken === "PENDENCIAS") tipo = "pendencias";

  if (!tipo) return null;

  const restoTokens = tokens.slice(1);
  if (!restoTokens.length) return null;

  let mesIndex = -1;
  for (let i = restoTokens.length - 1; i >= 0; i--) {
    if (MESES[restoTokens[i]]) {
      mesIndex = i;
      break;
    }
  }

  const mesToken = mesIndex >= 0 ? restoTokens[mesIndex] : null;
  const mesNum = mesToken ? MESES[mesToken] : null;
  const ano = new Date().getFullYear();
  const mesAno = mesNum ? `${String(mesNum).padStart(2, "0")}/${ano}` : null;

  const tokensSemMes = mesIndex >= 0 ? restoTokens.slice(0, mesIndex) : restoTokens.slice();

  const filiais = extrairFiliaisDeTokens(tokensSemMes);
  const tokensIndustria = tokensSemMes.filter((t) => !FILIAIS_VALIDAS.includes(t));

  let industria = null;
  for (let len = tokensIndustria.length; len >= 1; len--) {
    const candidato = tokensIndustria.slice(0, len).join(" ");
    const encontrado = MAPA_INDUSTRIAS[normalizarTexto(candidato)];
    if (encontrado) {
      industria = encontrado;
      break;
    }
  }

  if (!industria) {
    industria = {
      codigo: null,
      nome: tokensIndustria.join(" ").toUpperCase(),
      aliases: [],
    };
  }

  return {
    tipo,
    codigo: industria.codigo,
    industria: industria.nome,
    filiais,
    mesAno,
    nomeOriginal: nomeArquivo,
  };
}

module.exports = {
  FILIAIS_VALIDAS,
  INDUSTRIAS,
  MAPA_INDUSTRIAS,
  normalizarTexto,
  parseNomeArquivo,
};