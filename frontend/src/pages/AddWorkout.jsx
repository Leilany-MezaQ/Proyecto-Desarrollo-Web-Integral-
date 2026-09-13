import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";
import { MUSCLES } from "../utils/epley.js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyRow() {
  return { exerciseName: "", muscle: MUSCLES[0], weight: "", reps: "" };
}

export default function AddWorkout() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([emptyRow()]);
  const [routineNames, setRoutineNames] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/routine").then((res) => setRoutineNames(res.data.map((r) => r.name)));
  }, []);

  function updateRow(i, field, value) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }
  function removeRow(i) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const validRows = rows.filter((r) => r.exerciseName && r.weight && r.reps);
    if (validRows.length === 0) {
      setError("Agrega al menos un ejercicio con peso y repeticiones.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/workouts", {
        date,
        sets: validRows.map((r, i) => ({
          exerciseName: r.exerciseName,
          muscle: r.muscle,
          weight: Number(r.weight),
          reps: Number(r.reps),
          setNumber: i + 1,
        })),
      });
      navigate("/historial");
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo guardar el entrenamiento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <header className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Nuevo Registro</h2>
        <p className="text-gray-400">Añade los ejercicios de tu sesión de hoy.</p>
      </header>

      {error && <p className="bg-danger/20 text-danger text-sm rounded-lg p-3 mb-4 max-w-3xl">{error}</p>}

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="glass-card rounded-2xl p-5 border border-gray-800">
          <label className="block text-xs text-gray-400 mb-1">Fecha</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-dark border border-gray-700 rounded-lg p-2.5 text-white text-sm outline-none"
          />
        </div>

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 border border-gray-800 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Ejercicio</label>
                <input
                  list="routine-names"
                  type="text"
                  placeholder="Ej. Press de banca"
                  value={row.exerciseName}
                  onChange={(e) => updateRow(i, "exerciseName", e.target.value)}
                  className="w-full bg-dark border border-gray-700 rounded-lg p-2.5 text-white text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Músculo</label>
                <select
                  value={row.muscle}
                  onChange={(e) => updateRow(i, "muscle", e.target.value)}
                  className="w-full bg-dark border border-gray-700 rounded-lg p-2.5 text-white text-sm outline-none"
                >
                  {MUSCLES.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={row.weight}
                  onChange={(e) => updateRow(i, "weight", e.target.value)}
                  className="w-full bg-dark border border-gray-700 rounded-lg p-2.5 text-white text-sm outline-none"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Reps</label>
                  <input
                    type="number"
                    min="0"
                    value={row.reps}
                    onChange={(e) => updateRow(i, "reps", e.target.value)}
                    className="w-full bg-dark border border-gray-700 rounded-lg p-2.5 text-white text-sm outline-none"
                  />
                </div>
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(i)} className="text-danger text-xs font-semibold pb-2.5">
                    Quitar
                  </button>
                )}
              </div>
            </div>
          ))}
          <datalist id="routine-names">
            {routineNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="text-primary text-sm font-semibold hover:underline"
        >
          + Añadir otro ejercicio
        </button>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-3 px-8 rounded-lg"
          >
            {saving ? "Guardando…" : "Guardar entrenamiento"}
          </button>
        </div>
      </form>
    </Layout>
  );
}
