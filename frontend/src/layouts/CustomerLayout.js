import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, ShoppingCart, Package, User, LogOut } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/ui/badge";

const CustomerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const { isCustomer, customer, logout } = useAuth();
  const itemCount = getItemCount();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleProfileClick = () => {
    if (isCustomer) {
      // Show logout option or navigate to profile
      navigate("/orders");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex flex-col">
      {/* Header - Desktop */}
      <header className="hidden md:flex sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#1B4D3E] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="font-['Playfair_Display'] text-2xl font-bold text-[#1B4D3E]">FoodNova</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${isActive("/") && location.pathname === "/" ? "text-[#1B4D3E]" : "text-stone-600 hover:text-[#1B4D3E]"}`}
            >
              Home
            </Link>
            <Link 
              to="/orders" 
              className={`text-sm font-medium transition-colors ${isActive("/orders") ? "text-[#1B4D3E]" : "text-stone-600 hover:text-[#1B4D3E]"}`}
            >
              My Orders
            </Link>
            <Link 
              to="/cart" 
              className="relative text-sm font-medium text-stone-600 hover:text-[#1B4D3E] transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-[#C05621] text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                  {itemCount}
                </Badge>
              )}
            </Link>
            {isCustomer ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-stone-600">{customer?.name || customer?.phone}</span>
                <button 
                  onClick={logout}
                  className="text-stone-500 hover:text-red-500 transition-colors"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-[#1B4D3E] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153d31] transition-colors"
                data-testid="header-login-btn"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1B4D3E] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-['Playfair_Display'] text-xl font-bold text-[#1B4D3E]">FoodNova</span>
          </Link>
          
          <Link to="/cart" className="relative p-2" data-testid="mobile-cart-btn">
            <ShoppingCart className="w-6 h-6 text-stone-700" />
            {itemCount > 0 && (
              <Badge className="absolute top-0 right-0 bg-[#C05621] text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center">
                {itemCount}
              </Badge>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50 bottom-nav pb-safe">
        <div className="flex items-center justify-around py-2">
          <Link 
            to="/" 
            className={`flex flex-col items-center gap-1 px-4 py-2 ${isActive("/") && location.pathname === "/" ? "text-[#1B4D3E]" : "text-stone-500"}`}
            data-testid="nav-home"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          
          <Link 
            to="/cart" 
            className={`flex flex-col items-center gap-1 px-4 py-2 relative ${isActive("/cart") ? "text-[#1B4D3E]" : "text-stone-500"}`}
            data-testid="nav-cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute top-1 right-2 bg-[#C05621] text-white text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
            <span className="text-xs font-medium">Cart</span>
          </Link>
          
          <Link 
            to="/orders" 
            className={`flex flex-col items-center gap-1 px-4 py-2 ${isActive("/orders") ? "text-[#1B4D3E]" : "text-stone-500"}`}
            data-testid="nav-orders"
          >
            <Package className="w-5 h-5" />
            <span className="text-xs font-medium">Orders</span>
          </Link>
          
          <button 
            onClick={handleProfileClick}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${isActive("/login") || isActive("/profile") ? "text-[#1B4D3E]" : "text-stone-500"}`}
            data-testid="nav-profile"
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">{isCustomer ? "Account" : "Login"}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default CustomerLayout;
