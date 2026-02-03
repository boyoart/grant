import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Warehouse, 
  MapPin, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAdmin) {
    navigate("/admin/login");
    return null;
  }

  const isActive = (path) => location.pathname === path;
  const adminName = admin ? admin.name : "Admin";
  const adminEmail = admin ? admin.email : "";
  const adminInitial = adminName ? adminName[0] : "A";

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-emerald-800 text-white transform transition-transform duration-300 ease-in-out " +
        (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
      }>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <Link to="/admin/dashboard" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="font-bold text-lg">F</span>
                </div>
                <div>
                  <span className="font-serif text-xl font-bold">FoodNova</span>
                  <p className="text-xs text-white/60">Admin Panel</p>
                </div>
              </Link>
              <button 
                className="lg:hidden p-2 hover:bg-white/10 rounded"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Link
              to="/admin/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={"flex items-center gap-3 px-4 py-3 rounded-lg transition-colors " + (isActive("/admin/dashboard") ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link
              to="/admin/orders"
              onClick={() => setSidebarOpen(false)}
              className={"flex items-center gap-3 px-4 py-3 rounded-lg transition-colors " + (isActive("/admin/orders") ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Orders</span>
            </Link>
            <Link
              to="/admin/products"
              onClick={() => setSidebarOpen(false)}
              className={"flex items-center gap-3 px-4 py-3 rounded-lg transition-colors " + (isActive("/admin/products") ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="font-medium">Products</span>
            </Link>
            <Link
              to="/admin/inventory"
              onClick={() => setSidebarOpen(false)}
              className={"flex items-center gap-3 px-4 py-3 rounded-lg transition-colors " + (isActive("/admin/inventory") ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}
            >
              <Warehouse className="w-5 h-5" />
              <span className="font-medium">Inventory</span>
            </Link>
            <Link
              to="/admin/zones"
              onClick={() => setSidebarOpen(false)}
              className={"flex items-center gap-3 px-4 py-3 rounded-lg transition-colors " + (isActive("/admin/zones") ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}
            >
              <MapPin className="w-5 h-5" />
              <span className="font-medium">Delivery Zones</span>
            </Link>
            <Link
              to="/admin/settings"
              onClick={() => setSidebarOpen(false)}
              className={"flex items-center gap-3 px-4 py-3 rounded-lg transition-colors " + (isActive("/admin/settings") ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="font-bold">{adminInitial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{adminName}</p>
                <p className="text-xs text-white/60 truncate">{adminEmail}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full bg-transparent border-white/30 text-white hover:bg-white/10"
              onClick={handleLogout}
              data-testid="admin-logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-stone-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-stone-100 rounded-lg"
              data-testid="admin-menu-btn"
            >
              <Menu className="w-6 h-6 text-stone-700" />
            </button>
            <span className="font-serif text-lg font-bold text-emerald-800">FoodNova Admin</span>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
