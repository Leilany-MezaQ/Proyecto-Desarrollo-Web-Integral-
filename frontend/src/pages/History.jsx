import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [expanded, setExpanded] = useState(null);

  function load() {
    api.get("/workouts").then((res) => setSessions(res.data));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm("¿Eliminar esta sesión de entrenamiento?")) return;
    await api.delete(`/workouts/${id}`);
    load();
  }

  return (
    <Layout>
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold mb-2">Tu Historial</h2>
          <p className="text-gray-400">Revisa todos tus entrenamientos pasados.</p>
        </div>
        <div className="text-sm text-gray-500 font-semibold bg-gray-800 px-3 py-1 rounded-full">
          {sessions.length} Sesiones
        </div>
      </header>

      <div className="space-y-4">
        {sessions.length === 0 && <p className="text-gray-500 text-sm">Aún no tienes entrenamientos registrados.</p>}

        {sessions.map((s) => {
          const totalVolume = s.sets.reduce((acc, x) => acc + x.weight * x.reps, 0);
          const isOpen = expanded === s.id;
          return (
            <div key={s.id} className="bg-darker border border-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <button className="text-left" onClick={() => setExpanded(isOpen ? null : s.id)}>
                  <p className="font-bold">{new Date(s.date).toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long" })}</p>
                  <p className="text-xs text-gray-500">
                    {s.sets.length} sets · {Math.round(totalVolume)} kg de volumen
                  </p>
                </button>
                <button onClick={() => handleDelete(s.id)} className="text-danger text-xs font-semibold">
                  Eliminar
                </button>
              </div>

              {isOpen && (
                <ul className="mt-4 space-y-1 border-t border-gray-800 pt-3">
                  {s.sets.map((set_) => (
                    <li key={set_.id} className="flex justify-between text-sm text-gray-300">
                      <span>
                        {set_.exerciseName} <span className="text-gray-600">({set_.muscle})</span>
                      </span>
                      <span>
                        {set_.weight} kg × {set_.reps} reps
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
