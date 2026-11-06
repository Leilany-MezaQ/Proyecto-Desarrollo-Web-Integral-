import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Settings() {
  const { user, logout } = useAuth();
  const fileInput = useRef(null);
  const [status, setStatus] = useState("");

  async function handleExport() {
    const res = await api.get("/workouts");
    const rows = [];
    res.data.forEach((session) => {
      session.sets.forEach((set_) => {
        rows.push({
          fecha: new Date(session.date).toISOString().slice(0, 10),
          ejercicio: set_.exerciseName,
          musculo: set_.muscle,
          peso_kg: set_.weight,
          reps: set_.reps,
          set: set_.setNumber,
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HyperTrack");
    XLSX.writeFile(wb, `hypertrack_export_${Date.now()}.xlsx`);
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setStatus("Leyendo archivo…");

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);

    // Agrupa las filas del Excel por fecha para reconstruir las sesiones
    const byDate = {};
    rows.forEach((r) => {
      const fecha = String(r.fecha);
      if (!byDate[fecha]) byDate[fecha] = [];
      byDate[fecha].push({
        exerciseName: r.ejercicio,
        muscle: r.musculo,
        weight: Number(r.peso_kg),
        reps: Number(r.reps),
        setNumber: Number(r.set) || byDate[fecha].length + 1,
      });
    });

    const sessions = Object.entries(byDate).map(([date, sets]) => ({ date, sets }));

    try {
      const res = await api.post("/workouts/bulk", { sessions });
      setStatus(`Se importaron ${res.data.imported} sesiones correctamente.`);
    } catch (err) {
      setStatus("Ocurrió un error al importar el archivo.");
    } finally {
      fileInput.current.value = "";
    }
  }

  async function handleDeleteAll() {
    if (!confirm("Esto eliminará TODOS tus entrenamientos registrados. ¿Continuar?")) return;
    await api.delete("/workouts/all/clear");
    setStatus("Se eliminaron todos los registros.");
  }

  return (
    <Layout>
      <header className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Ajustes</h2>
        <p className="text-gray-400">Administra tu cuenta y tus datos.</p>
      </header>

      <div className="max-w-2xl space-y-6">
        <div className="glass-card rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-lg">
            {user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-bold">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-gray-800 space-y-4">
          <h3 className="font-bold">Datos</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleExport} className="bg-gray-800 hover:bg-gray-700 text-sm font-semibold py-2 px-4 rounded-lg">
              ⬇ Exportar a Excel
            </button>
            <button
              onClick={() => fileInput.current.click()}
              className="bg-gray-800 hover:bg-gray-700 text-sm font-semibold py-2 px-4 rounded-lg"
            >
              ⬆ Importar Excel
            </button>
            <input ref={fileInput} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          </div>
          {status && <p className="text-xs text-gray-400">{status}</p>}
        </div>

        <div className="glass-card rounded-2xl p-5 border border-danger/40 space-y-3">
          <h3 className="font-bold text-danger">Zona de riesgo</h3>
          <button onClick={handleDeleteAll} className="bg-danger/20 hover:bg-danger/30 text-danger text-sm font-semibold py-2 px-4 rounded-lg">
            Eliminar todos mis registros
          </button>
        </div>

        <button onClick={logout} className="text-gray-400 hover:text-white text-sm font-semibold md:hidden">
          Cerrar sesión
        </button>
      </div>
    </Layout>
  );
}
