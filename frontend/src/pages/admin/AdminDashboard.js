import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, AlertTriangle, TrendingUp, Clock, ArrowRight, ShoppingBag, Truck } from "lucide-react";
import { getDashboardStats, adminGetOrders, getLowStockProducts } from "../../lib/api";
import { formatCurrency, getStatusLabel, getStatusColor, formatDate } from "../../lib/utils";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, ordersRes, lowStockRes] = await Promise.all([
          getDashboardStats(),
          adminGetOrders(),
          getLowStockProducts()
        ]);
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data.slice(0, 5));
        setLowStockProducts(lowStockRes.data);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Pending Payment",
      value: stats?.orders?.pending_payment || 0,
      icon: Clock,
      color: "bg-amber-500",
      link: "/admin/orders?status=pending_payment"
    },
    {
      label: "Ready/Out for Delivery",
      value: (stats?.orders?.ready_for_pickup || 0) + (stats?.orders?.out_for_delivery || 0),
      icon: Truck,
      color: "bg-blue-500",
      link: "/admin/orders"
    },
    {
      label: "Today's Orders",
      value: stats?.today_orders || 0,
      icon: Package,
      color: "bg-green-500",
      link: "/admin/orders"
    },
    {
      label: "Total Revenue",
      value: formatCurrency(stats?.total_revenue || 0),
      icon: TrendingUp,
      color: "bg-[#1B4D3E]",
      link: "/admin/orders"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1A202C]">
          Dashboard
        </h1>
        <p className="text-sm text-stone-500">
          {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Link key={index} to={stat.link}>
            <Card className="p-4 bg-white border border-stone-200 hover:shadow-md transition-shadow rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#1A202C]">{stat.value}</p>
              <p className="text-sm text-stone-500">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-amber-800">Low Stock Alert</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.slice(0, 5).map((product) => (
              <Link 
                key={product.id} 
                to="/admin/inventory"
                className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm hover:bg-amber-200 transition-colors"
              >
                {product.name} ({product.stock_quantity} left)
              </Link>
            ))}
            {lowStockProducts.length > 5 && (
              <span className="px-3 py-1 text-amber-600 text-sm">
                +{lowStockProducts.length - 5} more
              </span>
            )}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="p-6 bg-white border border-stone-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-[#1A202C]">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-[#1B4D3E] font-medium flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-2" />
              <p className="text-stone-500">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link 
                  key={order.id} 
                  to="/admin/orders"
                  className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                  data-testid={`dashboard-order-${order.order_number}`}
                >
                  <div>
                    <p className="font-medium text-[#1A202C]">{order.order_number}</p>
                    <p className="text-sm text-stone-500">
                      {order.customer_name} • {formatCurrency(order.total)}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} text-xs`}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Order Status Summary */}
        <Card className="p-6 bg-white border border-stone-200 rounded-xl">
          <h2 className="font-semibold text-lg text-[#1A202C] mb-4">Order Status Summary</h2>
          
          <div className="space-y-3">
            {[
              { status: "pending_payment", label: "Pending Payment", count: stats?.orders?.pending_payment },
              { status: "confirmed", label: "Confirmed", count: stats?.orders?.confirmed },
              { status: "packing", label: "Packing", count: stats?.orders?.packing },
              { status: "ready_for_pickup", label: "Ready for Pickup", count: stats?.orders?.ready_for_pickup },
              { status: "out_for_delivery", label: "Out for Delivery", count: stats?.orders?.out_for_delivery },
              { status: "completed", label: "Completed", count: stats?.orders?.completed }
            ].map(({ status, label, count }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[0]}`} />
                  <span className="text-stone-600">{label}</span>
                </div>
                <span className="font-semibold text-[#1A202C]">{count || 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
