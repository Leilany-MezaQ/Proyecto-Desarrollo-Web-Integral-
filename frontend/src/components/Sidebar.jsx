import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "📈" },
  { to: "/historial", label: "Historial", icon: "🕓" },
  { to: "/rutina", label: "Mi Rutina", icon: "📋" },
  { to: "/registrar", label: "Registrar", icon: "➕" },
  { to: "/ajustes", label: "Ajustes", icon: "⚙️" },
];

export default function Sidebar() {
  const { logout, user } = useAuth();

  return (
    <nav className="bg-card border-b md:border-b-0 md:border-r border-gray-800 w-full md:w-64 flex-shrink-0 z-10 flex md:flex-col justify-between order-last md:order-first">
      <div className="hidden md:flex items-center p-6 border-b border-gray-800">
        <span className="text-3xl mr-3">🏋️</span>
        <h1 className="text-xl font-bold tracking-wider">
          Hyper<span className="text-primary">Track</span>
        </h1>
      </div>

      <div className="flex md:flex-col w-full md:flex-1 justify-around md:justify-start md:p-4">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `w-full flex flex-col md:flex-row items-center md:justify-start p-3 md:mb-2 rounded-lg transition-colors ${
                isActive ? "text-white bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`
            }
          >
            <span className="text-xl md:mr-3 mb-1 md:mb-0">{l.icon}</span>
            <span className="text-xs md:text-base font-semibold">{l.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="hidden md:block p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 mb-2 truncate">{user?.email}</p>
        <button
          onClick={logout}
          className="w-full text-sm text-gray-400 hover:text-danger font-semibold py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
