import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "./App.css";

const FILIAIS = ["DPR", "AMS", "DMT", "DMS", "DSC"];
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://painel-industria-backend.onrender.com";

function App() {
  const [dados, setDados] = useState({});
  const [filtroIndustria, setFiltroIndustria] = useState("");
  const [conectado, setConectado] = useState(false);
  const [atualizandoManual, setAtualizandoManual] = useState(false);

  async function carregarStatus(manual = false) {
    try {
      if (manual) {
        setAtualizandoManual(true);

        const res = await axios.post(`${API_URL}/refresh`, null, {
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

        setDados(res.data?.status || {});
        return;
      }

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

      setDados(res.data || {});
    } catch (error) {
      console.error("Erro ao carregar status:", error);
    } finally {
      if (manual) {
        setAtualizandoManual(false);
      }
    }
  }

  useEffect(() => {
    let ativo = true;

    async function carregarComControle() {
      if (!ativo) return;

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

    carregarComControle();

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
      carregarComControle();
    });

    socket.on("disconnect", () => {
      setConectado(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Erro de conexão socket:", error);
      setConectado(false);
    });

    socket.on("status-atualizado", () => {
      carregarComControle();
    });

    const intervalo = setInterval(() => {
      carregarComControle();
    }, 5000);

    const onFocus = () => {
      carregarComControle();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        carregarComControle();
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

  const linhas = useMemo(() => {
    const lista = Object.values(dados).sort(
      (a, b) => (a?.ordem ?? 999999) - (b?.ordem ?? 999999)
    );

    const termo = filtroIndustria.trim().toLowerCase();
    if (!termo) return lista;

    return lista.filter((row) => {
      const texto = `${row.industria ?? ""} ${row.codigo ?? ""}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [dados, filtroIndustria]);

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

        <span className={conectado ? "status-live on" : "status-live off"}>
          {conectado ? "● Ao vivo" : "○ Offline"}
        </span>

        <button
          type="button"
          className="refresh-button"
          onClick={() => carregarStatus(true)}
          disabled={atualizandoManual}
        >
          {atualizandoManual ? "Atualizando..." : "Atualizar painel"}
        </button>
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
                <th key={`p-${f}`} className="subhead">
                  {f}
                </th>
              ))}
              {FILIAIS.map((f) => (
                <th key={`pe-${f}`} className="subhead">
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

                  {FILIAIS.map((f) => {
                    const cell = row.precos?.[f] || {
                      atualizado: false,
                      mes: null,
                    };

                    return (
                      <td
                        key={`p-${row.industria}-${f}`}
                        className={cell.atualizado ? "ok" : "pending"}
                      >
                        {cell.atualizado
                          ? cell.mes
                            ? `Atualizado ${cell.mes}`
                            : "Atualizado"
                          : "-"}
                      </td>
                    );
                  })}

                  {FILIAIS.map((f) => {
                    const cell = row.pendencias?.[f] || {
                      atualizado: false,
                      mes: null,
                    };

                    return (
                      <td
                        key={`pe-${row.industria}-${f}`}
                        className={cell.atualizado ? "ok" : "pending"}
                      >
                        {cell.atualizado
                          ? cell.mes
                            ? `Atualizado ${cell.mes}`
                            : "Atualizado"
                          : "-"}
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