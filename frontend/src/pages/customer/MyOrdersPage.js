import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ArrowRight, ShoppingBag, Upload } from "lucide-react";
import { getMyOrders } from "../../lib/api";
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const { isCustomer } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!isCustomer) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await getMyOrders();
        setOrders(response.data);
      } catch (error) {
        console.error("Error loading orders:", error);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [isCustomer]);

  if (!isCustomer) {
    return (
      <div className="container mx-auto px-4 py-12 text-center max-w-md">
        <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-12 h-12 text-stone-400" />
        </div>
        <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1A202C] mb-2">
          Login to View Orders
        </h1>
        <p className="text-stone-500 mb-6">
          Please login with your phone number to see your order history.
        </p>
        <Link to="/login">
          <Button 
            className="bg-[#1B4D3E] hover:bg-[#153d31] text-white rounded-lg px-6"
            data-testid="login-to-view-btn"
          >
            Login Now
          </Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center max-w-md">
        <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-stone-400" />
        </div>
        <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1A202C] mb-2">
          No Orders Yet
        </h1>
        <p className="text-stone-500 mb-6">
          You haven't placed any orders yet. Start shopping to see your orders here.
        </p>
        <Link to="/">
          <Button 
            className="bg-[#1B4D3E] hover:bg-[#153d31] text-white rounded-lg px-6"
            data-testid="start-shopping-btn"
          >
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1A202C] mb-6">
        My Orders
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card 
            key={order.id}
            className="p-4 bg-white border border-stone-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/order/${order.order_number}`)}
            data-testid={`order-card-${order.order_number}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-[#1A202C]">{order.order_number}</p>
                <p className="text-sm text-stone-500">{formatDate(order.created_at)}</p>
              </div>
              <Badge className={`${getStatusColor(order.status)} text-xs`}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600">
                  {order.items.length} item{order.items.length > 1 ? "s" : ""} • 
                  {order.fulfillment_type === "pickup" ? " Pickup" : ` Delivery to ${order.delivery_zone_name}`}
                </p>
                <p className="font-bold text-[#1B4D3E] mt-1">
                  {formatCurrency(order.total)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {order.status === "pending_payment" && !order.payment_proof_url && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    <Upload className="w-3 h-3" />
                    Upload Proof
                  </span>
                )}
                <ArrowRight className="w-5 h-5 text-stone-400" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyOrdersPage;
