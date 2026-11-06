import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";
import { DAYS, MUSCLES } from "../utils/epley.js";

export default function Routine() {
  const [view, setView] = useState("active");
  const [entries, setEntries] = useState([]);
  const [archived, setArchived] = useState([]);
  const [form, setForm] = useState({ day: DAYS[0], muscle: MUSCLES[0], name: "" });
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionSource, setSuggestionSource] = useState("");

  function loadActive() {
    api.get("/routine").then((res) => setEntries(res.data));
  }
  function loadArchived() {
    api.get("/routine/archived").then((res) => setArchived(res.data));
  }

  useEffect(() => {
    loadActive();
  }, []);

  useEffect(() => {
    if (view === "archived") loadArchived();
  }, [view]);

  // Sugerencias desde la API externa (wger.de) según el músculo elegido en el formulario
  useEffect(() => {
    api.get(`/exercises/suggestions?muscle=${encodeURIComponent(form.muscle)}`).then((res) => {
      setSuggestions(res.data.suggestions || []);
      setSuggestionSource(res.data.source);
    });
  }, [form.muscle]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await api.post("/routine", form);
    setForm({ ...form, name: "" });
    loadActive();
  }

  async function handleArchive(id) {
    await api.patch(`/routine/${id}/archive`);
    loadActive();
  }
  async function handleRestore(id) {
    await api.patch(`/routine/${id}/restore`);
    loadArchived();
  }
  async function handleDelete(id) {
    await api.delete(`/routine/${id}`);
    loadArchived();
  }

  const byDay = DAYS.map((day) => ({ day, items: entries.filter((e) => e.day === day) }));

  return (
    <Layout>
      <header className="mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Mi Rutina</h2>
          <p className="text-gray-400">Diseña tu plan de entrenamiento por día y grupo muscular.</p>
        </div>
        <div className="flex gap-2 bg-darker p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setView("active")}
            className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
              view === "active" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Activa
          </button>
          <button
            onClick={() => setView("archived")}
            className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
              view === "archived" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Archivo
          </button>
        </div>
      </header>

      {view === "active" ? (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-gray-800 shadow-xl">
            <h3 className="text-lg font-bold mb-4">➕ Añadir Ejercicio al Plan</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Día</label>
                <select
                  value={form.day}
                  onChange={(e) => setForm({ ...form, day: e.target.value })}
                  className="w-full bg-dark border border-gray-700 rounded-lg p-2.5 text-white text-sm outline-none"
                >
                  {DAYS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Músculo</label>
                <select
                  value={form.muscle}
                  onChange={(e) => setForm({ ...form, muscle: e.target.value })}
                  className="w-full bg-dark border border-gray-700 rounded-lg p-2.5 text-white text-sm outline-none"
                >
                  {MUSCLES.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Ejercicio</label>
                <input
                  list="suggestion-list"
                  type="text"
                  required
                  placeholder="Ej. Press Plano"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-dark border border-gray-700 rounded-lg p-2.5 text-white text-sm outline-none"
                />
                <datalist id="suggestion-list">
                  {suggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <button type="submit" className="bg-primary hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg w-full">
                Guardar
              </button>
            </form>
            <p className="text-[11px] text-gray-500 mt-3">
              Sugerencias para «{form.muscle}» vía {suggestionSource === "wger.de" ? "API externa (wger.de)" : "catálogo local"}:{" "}
              {suggestions.slice(0, 4).join(" · ") || "—"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {byDay.map(({ day, items }) => (
              <div key={day} className="bg-darker border border-gray-800 rounded-xl p-4">
                <h4 className="font-bold mb-3">{day}</h4>
                {items.length === 0 && <p className="text-xs text-gray-600">Sin ejercicios</p>}
                <ul className="space-y-2">
                  {items.map((it) => (
                    <li key={it.id} className="flex justify-between items-center bg-card rounded-lg px-3 py-2 text-sm">
                      <div>
                        <p className="font-semibold">{it.name}</p>
                        <p className="text-[11px] text-gray-500">{it.muscle}</p>
                      </div>
                      <button onClick={() => handleArchive(it.id)} className="text-gray-500 hover:text-danger text-xs">
                        Archivar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-5 border border-gray-800 shadow-xl">
          <h3 className="text-lg font-bold mb-4">📦 Ejercicios Archivados</h3>
          {archived.length === 0 && <p className="text-sm text-gray-500">No hay ejercicios archivados.</p>}
          <div className="space-y-3">
            {archived.map((a) => (
              <div key={a.id} className="flex justify-between items-center bg-darker rounded-lg px-4 py-3">
                <div>
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-xs text-gray-500">
                    {a.day} · {a.muscle}
                  </p>
                </div>
                <div className="flex gap-3 text-xs">
                  <button onClick={() => handleRestore(a.id)} className="text-primary font-semibold">
                    Restaurar
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="text-danger font-semibold">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
