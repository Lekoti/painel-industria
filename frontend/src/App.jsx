import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const FILIAIS = ["DPR", "AMS", "DMT", "DMS", "DSC"];
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function App() {
  const [dados, setDados] = useState({});
  const [filtroIndustria, setFiltroIndustria] = useState("");
  const [somenteAtualizadas, setSomenteAtualizadas] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await axios.get(`${API_URL}/status`);
        setDados(res.data || {});
      } catch (error) {
        console.error("Erro ao carregar status:", error);
      }
    }

    carregar();
  }, []);

  function temAlgumaAtualizacao(row) {
    const temPreco = FILIAIS.some((f) => row.precos?.[f]?.atualizado);
    const temPendencia = FILIAIS.some((f) => row.pendencias?.[f]?.atualizado);
    return temPreco || temPendencia;
  }

  const linhas = useMemo(() => {
    let lista = Object.values(dados).sort(
      (a, b) => (a?.ordem ?? 999999) - (b?.ordem ?? 999999)
    );

    const termo = filtroIndustria.trim().toLowerCase();

    if (termo) {
      lista = lista.filter((row) => {
        const texto = `${row.industria ?? ""} ${row.codigo ?? ""}`.toLowerCase();
        return texto.includes(termo);
      });
    }

    if (somenteAtualizadas) {
      lista = lista.filter((row) => temAlgumaAtualizacao(row));
    }

    return lista;
  }, [dados, filtroIndustria, somenteAtualizadas]);

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

        <button
          type="button"
          className={`filter-toggle-btn ${somenteAtualizadas ? "active" : ""}`}
          onClick={() => setSomenteAtualizadas((prev) => !prev)}
        >
          {somenteAtualizadas
            ? "Mostrando só atualizadas"
            : "Mostrar só atualizadas"}
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
                        {cell.atualizado ? `Atualizado ${cell.mes}` : "-"}
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
                        {cell.atualizado ? `Atualizado ${cell.mes}` : "-"}
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