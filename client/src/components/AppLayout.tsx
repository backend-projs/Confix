import { Outlet, useLocation } from "react-router-dom";
import { Bell, User } from "lucide-react";
import Sidebar from "./Sidebar";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inspect": "New Inspection",
  "/reports": "Reports",
  "/maintenance": "Maintenance Queue",
  "/map": "Infrastructure Map",
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const title = titles[pathname] || "Confix";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-azcon-100 text-azcon-700">
                <User size={14} />
              </div>
              <span className="text-xs font-medium text-gray-700">Field Engineer</span>
            </div>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
