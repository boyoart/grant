import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { adminLogin, isAdmin } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in as admin
  if (isAdmin) {
    navigate("/admin/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await adminLogin(email, password);
      toast.success("Login successful!");
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Error logging in:", error);
      const errorMsg = error.response?.data?.detail || "Invalid email or password";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B4D3E] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1B4D3E] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1A202C]">
            Admin Login
          </h1>
          <p className="text-stone-500 mt-2">
            Sign in to manage your store
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A202C] mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Mail className="w-5 h-5 text-stone-400" />
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@foodnova.com"
                  className="pl-12 py-5"
                  data-testid="admin-email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A202C] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-stone-400" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-12 pr-12 py-5"
                  data-testid="admin-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#1B4D3E] hover:bg-[#153d31] text-white py-6 rounded-xl text-lg font-semibold"
            data-testid="admin-login-btn"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-stone-50 rounded-lg">
          <p className="text-sm text-stone-600 text-center">
            <strong>Default credentials:</strong><br />
            Email: admin@foodnova.com<br />
            Password: admin123
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
