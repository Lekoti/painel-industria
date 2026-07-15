import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "./App.css";

const FILIAIS = ["DPR", "AMS", "DMT", "DMS", "DSC"];
const API_URL =
  import.meta.env.VITE_API_URL || "https://painel-industria-backend.onrender.com";

function App() {
  const [dados, setDados] = useState({});
  const [filtroIndustria, setFiltroIndustria] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos"); // "precos", "pendencias", "todos-atualizados"
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const res = await axios.get(`${API_URL}/status`, {
          timeout: 30000,
          params: {
            t: Date.now(),
          },
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (ativo) {
          setDados(res.data || {});
        }
      } catch (error) {
        console.error("Erro ao carregar status:", error);
      }
    }

    carregar();

    const socket = io(API_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      setConectado(true);
      carregar();
    });

    socket.on("disconnect", () => {
      setConectado(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Erro de conexão socket:", error);
      setConectado(false);
    });

    socket.on("status-atualizado", () => {
      carregar();
    });

    const intervalo = setInterval(() => {
      carregar();
    }, 5000);

    const onFocus = () => {
      carregar();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        carregar();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      ativo = false;
      clearInterval(intervalo);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      socket.disconnect();
    };
  }, []);

  // Preços: pelo menos uma filial ok
  function linhaTemPrecosAtualizados(row) {
    if (!row || !row.precos) return false;

    for (const filial of FILIAIS) {
      const infoFilial = row.precos[filial];
      if (infoFilial && infoFilial.atualizado === true) {
        return true;
      }
    }

    return false;
  }

  // Pendências: pelo menos uma filial ok
  function linhaTemPendenciasAtualizadas(row) {
    if (!row || !row.pendencias) return false;

    for (const filial of FILIAIS) {
      const infoFilial = row.pendencias[filial];
      if (infoFilial && infoFilial.atualizado === true) {
        return true;
      }
    }

    return false;
  }

  // Contém alguma atualização: preço OU pendência atualizada em qualquer filial
  function linhaTemAlgumaAtualizacao(row) {
    if (!row) return false;

    if (linhaTemPrecosAtualizados(row)) return true;
    if (linhaTemPendenciasAtualizadas(row)) return true;

    return false;
  }

  const linhas = useMemo(() => {
    const lista = Object.values(dados).sort(
      (a, b) => (a?.ordem ?? 999999) - (b?.ordem ?? 999999)
    );

    const termo = filtroIndustria.trim().toLowerCase();
    let filtrada = lista;

    if (termo) {
      filtrada = filtrada.filter((row) => {
        const texto = `${row.industria ?? ""} ${row.codigo ?? ""}`.toLowerCase();
        return texto.includes(termo);
      });
    }

    if (filtroTipo === "precos") {
      filtrada = filtrada.filter((row) => linhaTemPrecosAtualizados(row));
    } else if (filtroTipo === "pendencias") {
      filtrada = filtrada.filter((row) => linhaTemPendenciasAtualizadas(row));
    } else if (filtroTipo === "todos-atualizados") {
      filtrada = filtrada.filter((row) => linhaTemAlgumaAtualizacao(row));
    }

    return filtrada;
  }, [dados, filtroIndustria, filtroTipo]);

  return (
    <div className="page">
      <div className="toolbar">
        <input
          type="text"
          className="filter-input"
          placeholder="Filtrar indústria..."
          value={filtroIndustria}
          onChange={(e) => setFiltroIndustria(e.target.value)}
        />

        <div className="toolbar-buttons">
          <button
            className={
              filtroTipo === "precos" ? "filter-btn active" : "filter-btn"
            }
            onClick={() => setFiltroTipo("precos")}
          >
            Preços atualizados
          </button>
          <button
            className={
              filtroTipo === "pendencias" ? "filter-btn active" : "filter-btn"
            }
            onClick={() => setFiltroTipo("pendencias")}
          >
            Pendências atualizadas
          </button>
          <button
            className={
              filtroTipo === "todos-atualizados"
                ? "filter-btn active"
                : "filter-btn"
            }
            onClick={() => setFiltroTipo("todos-atualizados")}
          >
            Contém alguma atualização
          </button>
          <button
            className={filtroTipo === "todos" ? "filter-btn active" : "filter-btn"}
            onClick={() => {
              setFiltroTipo("todos");
              setFiltroIndustria("");
            }}
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="painel">
          <thead>
            <tr>
              <th rowSpan="2" className="col-industria header-industria">
                INDUSTRIA
              </th>
              <th colSpan="5" className="group group-precos">
                Preços Ok
              </th>
              <th colSpan="5" className="group group-pendencias">
                Pendências Ok
              </th>
            </tr>
            <tr>
              {FILIAIS.map((f) => (
                <th key={`p-${f}`} className="subhead subhead-precos">
                  {f}
                </th>
              ))}
              {FILIAIS.map((f) => (
                <th key={`pe-${f}`} className="subhead subhead-pendencias">
                  {f}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {linhas.length === 0 ? (
              <tr>
                <td colSpan="11" className="empty">
                  Nenhuma indústria encontrada.
                </td>
              </tr>
            ) : (
              linhas.map((row) => (
                <tr key={row.codigo ?? row.industria}>
                  <td className="col-industria body-industria">
                    <div className="industry-inline">
                      <span className="industry-name">{row.industria}</span>
                      {row.codigo != null && (
                        <span className="industry-code">#{row.codigo}</span>
                      )}
                    </div>
                  </td>

                  {FILIAIS.map((filial) => {
                    const info = row.precos?.[filial];
                    const ok = info?.atualizado === true;
                    const valor = ok ? info.mes : "-";

                    return (
                      <td
                        key={`preco-${row.industria}-${filial}`}
                        className={ok ? "ok" : "pending"}
                      >
                        {valor}
                      </td>
                    );
                  })}

                  {FILIAIS.map((filial) => {
                    const info = row.pendencias?.[filial];
                    const ok = info?.atualizado === true;
                    const valor = ok ? info.mes : "-";

                    return (
                      <td
                        key={`pend-${row.industria}-${filial}`}
                        className={ok ? "ok" : "pending"}
                      >
                        {valor}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;