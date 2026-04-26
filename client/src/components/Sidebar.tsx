import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  FileText,
  Wrench,
  MapPin,
  Shield,
} from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inspect", label: "Inspect", icon: Search },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/map", label: "Map", icon: MapPin },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-azcon-900 bg-gradient-to-b from-azcon-950 to-[#0c1a3d] text-white">
      {/* Brand */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/20">
            <Shield size={20} className="text-cyan-400" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">Confix</span>
            <p className="text-[10px] font-medium uppercase tracking-widest text-cyan-400/80">AssetSense</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-azcon-500">Navigation</p>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-azcon-700/50 text-white shadow-sm shadow-azcon-900/50"
                  : "text-azcon-300 hover:bg-azcon-800/50 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${isActive ? "bg-cyan-500/20 text-cyan-400" : "bg-azcon-800/50 text-azcon-400 group-hover:bg-azcon-700/50 group-hover:text-azcon-200"}`}>
                  <Icon size={16} />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-azcon-800/50 px-6 py-4">
        <p className="text-[10px] font-medium text-azcon-500">AZCON Holding</p>
        <p className="text-[10px] text-azcon-600">&copy; {new Date().getFullYear()} Infrastructure Platform</p>
      </div>
    </aside>
  );
}
