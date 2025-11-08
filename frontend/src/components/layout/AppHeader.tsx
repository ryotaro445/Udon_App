import { Link, NavLink } from "react-router-dom";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight text-lg">
          Udon Admin
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <NavLink
            to="/order"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-full ${isActive ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`
            }
          >
            注文
          </NavLink>
          <NavLink
            to="/kitchen"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-full ${isActive ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`
            }
          >
            キッチン
          </NavLink>
          <NavLink
            to="/staff"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-full ${isActive ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`
            }
          >
            
            分析
          </NavLink>
        </nav>
      </div>
    </header>
  );
}