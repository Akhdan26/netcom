import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, Truck, Database, LogOut, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Revenue & Anomali", path: "/", icon: BarChart3 },
    { name: "Pesanan Belum Dikirim", path: "/orders/pending", icon: Truck },
    { name: "Dataset Explorer (CRUD)", path: "/datasets", icon: Database },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg font-bold">NC</div>
          <div>
            <h1 className="font-semibold text-lg leading-tight">
              Netcom Analytics
            </h1>
            <p className="text-xs text-slate-400">Senior SE Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="bg-slate-800 p-2 rounded-full">
              <User size={16} className="text-slate-300" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || "Admin User"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.email || "admin@netcom.com"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {navItems.find((item) => item.path === location.pathname)?.name ||
              "Dashboard"}
          </h2>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2.5 py-1 rounded-full border border-emerald-200">
            System Online
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
