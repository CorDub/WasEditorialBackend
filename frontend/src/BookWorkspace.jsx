import { useState, useEffect, useContext, useMemo } from "react";
import Navbar from "./Navbar";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import UserContext from "./UserContext";
import BookInventory from "./BookInventory";
import "./BookWorkspace.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook, faMagnifyingGlass, faBoxesStacked,
  faDollarSign, faRightLeft, faClockRotateLeft
} from "@fortawesome/free-solid-svg-icons";

const nf = new Intl.NumberFormat("es-MX");
const money = (n) => "$" + nf.format(Number(n ?? 0).toFixed(2));

function BookWorkspace() {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || "";
  const { user } = useContext(UserContext);

  // catálogo de libros (para el buscador)
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  // libro seleccionado
  const [selectedBook, setSelectedBook] = useState(null); // {id, name, disponibles, ...}
  const [specificBook, setSpecificBook] = useState(null); // detalle para BookInventory
  const [specificBookOpen, setSpecificBookOpen] = useState(false);

  // datos para pestañas
  const [allSales, setAllSales] = useState([]);     // ventas aplanadas
  const [allTransfers, setAllTransfers] = useState([]);

  const [activeTab, setActiveTab] = useState("inventario");

  // --- Carga inicial: catálogo de libros + ventas + movimientos ---
  useEffect(() => {
    async function load() {
      try {
        const [booksRes, salesRes, transfersRes] = await Promise.all([
          fetch(`${baseURL}/api/admin/inventories/inventoriesByBook`, { credentials: "include" }),
          fetch(`${baseURL}/api/admin/sales/sales?startDate=2024-01-01&endDate=2027-12-31`, { credentials: "include" }),
          fetch(`${baseURL}/api/admin/transfers/transfers`, { credentials: "include" }),
        ]);

        if (booksRes.ok) {
          const data = await booksRes.json();
          setBooks(Array.isArray(data) ? data : []);
        }
        if (salesRes.ok) {
          const data = await salesRes.json();
          // viene agrupado por mes -> aplanar todas las ventas
          const flat = [];
          for (const month of Object.values(data)) {
            if (month?.sales?.length) flat.push(...month.sales);
          }
          setAllSales(flat);
        }
        if (transfersRes.ok) {
          const data = await transfersRes.json();
          setAllTransfers(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Error cargando datos del centro de trabajo:", e);
      }
    }
    load();
  }, [baseURL]);

  // --- Búsqueda de libros ---
  // Sin texto: muestra los primeros libros (para que sea obvio cómo elegir).
  // Con texto: filtra por título.
  const bookResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books.slice(0, 8);
    return books.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 8);
  }, [books, query]);

  async function chooseBook(book) {
    setSelectedBook(book);
    setQuery(book.name);
    setShowResults(false);
    setActiveTab("inventario");
    // cargar el detalle del inventario del libro (para la pestaña Inventario)
    try {
      const res = await fetch(
        `${baseURL}/api/admin/inventories/inventoriesByBook/${book.id}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setSpecificBook(data);
        setSpecificBookOpen(true);
      }
    } catch (e) {
      console.error("Error cargando inventario del libro:", e);
    }
  }

  // --- Filtrado por libro seleccionado ---
  const bookSales = useMemo(() => {
    if (!selectedBook) return [];
    return allSales.filter((s) => s.inventory?.bookId === selectedBook.id);
  }, [allSales, selectedBook]);

  const bookTransfers = useMemo(() => {
    if (!selectedBook) return [];
    return allTransfers.filter(
      (t) =>
        t.fromInventory?.bookId === selectedBook.id ||
        t.toInventory?.bookId === selectedBook.id
    );
  }, [allTransfers, selectedBook]);

  // historial = ventas + movimientos en orden cronológico
  const history = useMemo(() => {
    const events = [];
    for (const s of bookSales) {
      events.push({
        kind: "venta",
        dateStr: s.dateStr,
        detail: `${s.quantity} ud. en ${s.inventory?.bookstore?.name ?? "—"}`,
        amount: (s.inventory?.price ?? 0) * s.quantity,
      });
    }
    for (const t of bookTransfers) {
      const fromName = t.fromInventory?.bookstore?.name ?? "—";
      const toName = t.toInventory?.bookstore?.name ?? "autor/externo";
      events.push({
        kind: "mov",
        dateStr: t.dateStr ?? (t.deliveryDate ? t.deliveryDate.substring(0, 10) : ""),
        detail: `${t.quantity} ud. ${fromName} → ${toName} (${t.type})`,
        amount: null,
      });
    }
    return events.sort((a, b) => (b.dateStr || "").localeCompare(a.dateStr || ""));
  }, [bookSales, bookTransfers]);

  const tabs = [
    { key: "inventario", label: "Inventario", icon: faBoxesStacked },
    { key: "ventas", label: "Ventas", icon: faDollarSign },
    { key: "movimientos", label: "Movimientos", icon: faRightLeft },
    { key: "historial", label: "Historial", icon: faClockRotateLeft },
  ];

  return (
    <div className="bw-page">
      <Navbar subNav={user.role} active={"libro"} />
      <div className="bw-container">
        {/* Encabezado + buscador */}
        <div className="bw-header">
          <h1 className="bw-title">
            <FontAwesomeIcon icon={faBook} /> Centro de trabajo
          </h1>
          <div className="bw-book-picker">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              type="text"
              placeholder="Buscar libro por título..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 150)}
            />
            {showResults && bookResults.length > 0 && (
              <div className="bw-book-results">
                {bookResults.map((b) => (
                  <div key={b.id} className="bw-book-result" onClick={() => chooseBook(b)}>
                    <span className="bw-result-name">{b.name}</span>
                    <span className="bw-result-meta">{nf.format(b.disponibles ?? 0)} disp.</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {!selectedBook ? (
          <div className="bw-empty">
            <FontAwesomeIcon icon={faBook} />
            <p>Busca y elige un libro para ver y gestionar todo en un solo lugar.</p>
          </div>
        ) : (
          <>
            {/* Tarjeta del libro + resumen */}
            <div className="bw-book-card">
              <div className="bw-book-card-title">{selectedBook.name}</div>
              <div className="bw-summary">
                <div className="bw-summary-item">
                  <div className="bw-summary-value">{nf.format(selectedBook.disponibles ?? 0)}</div>
                  <div className="bw-summary-label">Disponibles</div>
                </div>
                <div className="bw-summary-item">
                  <div className="bw-summary-value">{nf.format(selectedBook.ventas ?? 0)}</div>
                  <div className="bw-summary-label">Vendidos</div>
                </div>
                <div className="bw-summary-item">
                  <div className="bw-summary-value">{nf.format(selectedBook.impressionInicial ?? 0)}</div>
                  <div className="bw-summary-label">Impresión inicial</div>
                </div>
              </div>
            </div>

            {/* Pestañas */}
            <div className="bw-tabs">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`bw-tab ${activeTab === t.key ? "bw-tab-active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  <FontAwesomeIcon icon={t.icon} /> {t.label}
                </button>
              ))}
            </div>

            {/* Contenido */}
            {activeTab === "inventario" && (
              <div>
                {specificBookOpen && specificBook && (
                  <BookInventory
                    specificBook={specificBook}
                    setSpecificBookOpen={setSpecificBookOpen}
                    isBookInventoryOpen={true}
                    setBookInventoryOpen={() => {}}
                    setRetreat={() => {}}
                    preferredFontSize={user.font_size}
                  />
                )}
              </div>
            )}

            {activeTab === "ventas" && (
              <div className="bw-tab-content">
                {bookSales.length === 0 ? (
                  <div className="bw-tab-empty">Este libro no tiene ventas registradas.</div>
                ) : (
                  <table className="bw-table">
                    <thead>
                      <tr>
                        <th>Fecha</th><th>Librería</th>
                        <th className="bw-num">Cantidad</th>
                        <th className="bw-num">Precio</th>
                        <th className="bw-num">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookSales.map((s) => (
                        <tr key={s.id}>
                          <td>{s.dateStr}</td>
                          <td>{s.inventory?.bookstore?.name ?? "—"}</td>
                          <td className="bw-num">{s.quantity}</td>
                          <td className="bw-num">{money(s.inventory?.price)}</td>
                          <td className="bw-num">{money((s.inventory?.price ?? 0) * s.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "movimientos" && (
              <div className="bw-tab-content">
                {bookTransfers.length === 0 ? (
                  <div className="bw-tab-empty">Este libro no tiene movimientos registrados.</div>
                ) : (
                  <table className="bw-table">
                    <thead>
                      <tr>
                        <th>Fecha</th><th>Origen</th><th>Destino</th>
                        <th className="bw-num">Cantidad</th><th>Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookTransfers.map((t) => (
                        <tr key={t.id}>
                          <td>{t.dateStr ?? (t.deliveryDate ? t.deliveryDate.substring(0, 10) : "—")}</td>
                          <td>{t.fromInventory?.bookstore?.name ?? "—"}</td>
                          <td>{t.toInventory?.bookstore?.name ?? "autor / externo"}</td>
                          <td className="bw-num">{t.quantity}</td>
                          <td>{t.type === "send" ? "Envío" : t.type === "return" ? "Devolución" : t.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "historial" && (
              <div className="bw-tab-content">
                {history.length === 0 ? (
                  <div className="bw-tab-empty">Sin eventos para este libro.</div>
                ) : (
                  <table className="bw-table">
                    <thead>
                      <tr>
                        <th>Fecha</th><th>Tipo</th><th>Detalle</th>
                        <th className="bw-num">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((e, i) => (
                        <tr key={i}>
                          <td>{e.dateStr || "—"}</td>
                          <td>
                            <span className={`bw-badge bw-badge--${e.kind === "venta" ? "venta" : "mov"}`}>
                              {e.kind === "venta" ? "Venta" : "Movimiento"}
                            </span>
                          </td>
                          <td>{e.detail}</td>
                          <td className="bw-num">{e.amount != null ? money(e.amount) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BookWorkspace;
