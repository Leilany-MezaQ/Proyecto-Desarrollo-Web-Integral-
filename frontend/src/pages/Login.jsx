import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-[100dvh] flex items-center justify-center bg-darker px-4">
      <div className="w-full max-w-sm glass-card rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <span className="text-4xl">🏋️</span>
          <h1 className="text-2xl font-bold mt-2">
            Hyper<span className="text-primary">Track</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        {error && <p className="bg-danger/20 text-danger text-sm rounded-lg p-3 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Correo</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-dark border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-dark border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-primary outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-primary font-semibold">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
