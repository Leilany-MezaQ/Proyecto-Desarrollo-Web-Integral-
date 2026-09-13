import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";
import { estimate1RM } from "../utils/epley.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const CHART_OPTS_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#9ca3af" } } },
  scales: {
    x: { ticks: { color: "#9ca3af" }, grid: { color: "#262626" } },
    y: { ticks: { color: "#9ca3af" }, grid: { color: "#262626" } },
  },
};

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState("");

  useEffect(() => {
    api
      .get("/workouts")
      .then((res) => setSessions(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Lista de ejercicios distintos registrados, para el selector de la gráfica de 1RM
  const exerciseNames = useMemo(() => {
    const set = new Set();
    sessions.forEach((s) => s.sets.forEach((set_) => set.add(set_.exerciseName)));
    return Array.from(set);
  }, [sessions]);

  useEffect(() => {
    if (!selectedExercise && exerciseNames.length > 0) setSelectedExercise(exerciseNames[0]);
  }, [exerciseNames, selectedExercise]);

  // Gráfica de fuerza estimada (1RM) por sesión, para el ejercicio seleccionado
  const rmChartData = useMemo(() => {
    const points = sessions
      .slice()
      .reverse()
      .map((s) => {
        const relevantSets = s.sets.filter((x) => x.exerciseName === selectedExercise);
        if (relevantSets.length === 0) return null;
        const best = Math.max(...relevantSets.map((x) => estimate1RM(x.weight, x.reps)));
        return { date: new Date(s.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }), value: best };
      })
      .filter(Boolean);

    return {
      labels: points.map((p) => p.date),
      datasets: [
        {
          label: `1RM estimado — ${selectedExercise || "—"}`,
          data: points.map((p) => p.value),
          borderColor: "#3b82f6",
          backgroundColor: "#3b82f633",
          tension: 0.3,
        },
      ],
    };
  }, [sessions, selectedExercise]);

  // Volumen total (peso x reps) por músculo en los últimos 7 días
  const volumeChartData = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const byMuscle = {};
    sessions.forEach((s) => {
      if (new Date(s.date).getTime() < sevenDaysAgo) return;
      s.sets.forEach((set_) => {
        byMuscle[set_.muscle] = (byMuscle[set_.muscle] || 0) + set_.weight * set_.reps;
      });
    });
    const labels = Object.keys(byMuscle);
    return {
      labels,
      datasets: [
        {
          label: "Volumen (kg)",
          data: labels.map((m) => Math.round(byMuscle[m])),
          backgroundColor: "#10b981aa",
        },
      ],
    };
  }, [sessions]);

  // Mapa de fatiga: días desde la última vez que se entrenó cada músculo
  const fatigue = useMemo(() => {
    const lastTrained = {};
    sessions.forEach((s) => {
      s.sets.forEach((set_) => {
        const t = new Date(s.date).getTime();
        if (!lastTrained[set_.muscle] || t > lastTrained[set_.muscle]) lastTrained[set_.muscle] = t;
      });
    });
    const muscles = ["Pecho", "Espalda", "Pierna", "Hombro", "Bicep", "Tricep"];
    return muscles.map((m) => {
      if (!lastTrained[m]) return { muscle: m, status: "Sin datos", color: "bg-gray-700" };
      const days = Math.floor((Date.now() - lastTrained[m]) / (1000 * 60 * 60 * 24));
      if (days < 2) return { muscle: m, status: `Hace ${days}d · Fatigado`, color: "bg-danger/70" };
      if (days < 4) return { muscle: m, status: `Hace ${days}d · Recuperando`, color: "bg-yellow-600/70" };
      return { muscle: m, status: `Hace ${days}d · Listo`, color: "bg-accent/70" };
    });
  }, [sessions]);

  // Sugerencias de sobrecarga progresiva basadas en la última sesión de cada ejercicio
  const suggestions = useMemo(() => {
    const lastByExercise = {};
    sessions.forEach((s) => {
      s.sets.forEach((set_) => {
        const t = new Date(s.date).getTime();
        if (!lastByExercise[set_.exerciseName] || t > lastByExercise[set_.exerciseName].t) {
          lastByExercise[set_.exerciseName] = { t, sets: [] };
        }
      });
    });
    sessions.forEach((s) => {
      s.sets.forEach((set_) => {
        const t = new Date(s.date).getTime();
        if (lastByExercise[set_.exerciseName]?.t === t) lastByExercise[set_.exerciseName].sets.push(set_);
      });
    });

    return Object.entries(lastByExercise).map(([name, info]) => {
      const avgReps = info.sets.reduce((a, b) => a + b.reps, 0) / info.sets.length;
      const maxWeight = Math.max(...info.sets.map((s) => s.weight));
      if (avgReps >= 12) {
        return { name, tip: `Sube a ${maxWeight + 2.5} kg — ya dominas las repeticiones actuales.` };
      }
      return { name, tip: `Intenta una repetición más por serie a ${maxWeight} kg.` };
    });
  }, [sessions]);

  if (loading) {
    return (
      <Layout>
        <p className="text-gray-400">Cargando…</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Resumen de Progreso</h2>
        <p className="text-gray-400">Analiza tu fuerza y recibe sugerencias de sobrecarga.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-darker border border-gray-800 p-4 rounded-xl">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sesiones Totales</p>
          <p className="text-xl font-bold">{sessions.length}</p>
        </div>
        <div className="bg-darker border border-gray-800 p-4 rounded-xl">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ejercicios distintos</p>
          <p className="text-xl font-bold">{exerciseNames.length}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-3">Estado de Recuperación</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {fatigue.map((f) => (
            <div key={f.muscle} className={`${f.color} rounded-xl p-3 text-center`}>
              <p className="font-bold text-sm">{f.muscle}</p>
              <p className="text-xs text-gray-100/80 mt-1">{f.status}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-4 md:p-6 shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Fuerza Estimada (1RM)</h3>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="bg-darker border border-gray-700 text-white rounded-lg p-2 text-sm outline-none"
            >
              {exerciseNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400 mb-4">Basado en la fórmula Epley (Peso x Reps).</p>
          <div className="h-64">
            <Line data={rmChartData} options={CHART_OPTS_BASE} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 md:p-6 shadow-xl">
          <h3 className="text-lg font-semibold mb-2">Volumen (Últimos 7 días)</h3>
          <p className="text-xs text-gray-400 mb-4">Total de kg movidos por grupo muscular.</p>
          <div className="h-64">
            <Bar data={volumeChartData} options={CHART_OPTS_BASE} />
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-4 mt-10">Sugerencias Inteligentes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.length === 0 && <p className="text-gray-500 text-sm">Registra tu primer entrenamiento para ver sugerencias.</p>}
        {suggestions.map((s) => (
          <div key={s.name} className="bg-darker border border-gray-800 rounded-xl p-4">
            <p className="font-bold mb-1">{s.name}</p>
            <p className="text-sm text-gray-400">{s.tip}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
