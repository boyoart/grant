import React, { useState, useEffect } from "react";
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
        const statsRes = await getDashboardStats();
        const ordersRes = await adminGetOrders();
        const lowStockRes = await getLowStockProducts();
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
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const pendingCount = stats && stats.orders ? stats.orders.pending_payment : 0;
  const readyCount = stats && stats.orders ? (stats.orders.ready_for_pickup || 0) + (stats.orders.out_for_delivery || 0) : 0;
  const todayCount = stats ? stats.today_orders : 0;
  const totalRevenue = stats ? stats.total_revenue : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-sm text-stone-500">
          {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/orders?status=pending_payment">
          <Card className="p-4 bg-white border border-stone-200 hover:shadow-md transition-shadow rounded-xl">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-stone-800">{pendingCount}</p>
            <p className="text-sm text-stone-500">Pending Payment</p>
          </Card>
        </Link>
        <Link to="/admin/orders">
          <Card className="p-4 bg-white border border-stone-200 hover:shadow-md transition-shadow rounded-xl">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-stone-800">{readyCount}</p>
            <p className="text-sm text-stone-500">Ready/Out for Delivery</p>
          </Card>
        </Link>
        <Link to="/admin/orders">
          <Card className="p-4 bg-white border border-stone-200 hover:shadow-md transition-shadow rounded-xl">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-stone-800">{todayCount}</p>
            <p className="text-sm text-stone-500">Today's Orders</p>
          </Card>
        </Link>
        <Link to="/admin/orders">
          <Card className="p-4 bg-white border border-stone-200 hover:shadow-md transition-shadow rounded-xl">
            <div className="w-10 h-10 bg-emerald-800 rounded-lg flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-stone-800">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-stone-500">Total Revenue</p>
          </Card>
        </Link>
      </div>

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
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border border-stone-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-stone-800">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-emerald-800 font-medium flex items-center gap-1 hover:underline">
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
                >
                  <div>
                    <p className="font-medium text-stone-800">{order.order_number}</p>
                    <p className="text-sm text-stone-500">{order.customer_name} - {formatCurrency(order.total)}</p>
                  </div>
                  <Badge className={getStatusColor(order.status) + " text-xs"}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 bg-white border border-stone-200 rounded-xl">
          <h2 className="font-semibold text-lg text-stone-800 mb-4">Order Status Summary</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-100" />
                <span className="text-stone-600">Pending Payment</span>
              </div>
              <span className="font-semibold text-stone-800">{stats && stats.orders ? stats.orders.pending_payment || 0 : 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-100" />
                <span className="text-stone-600">Confirmed</span>
              </div>
              <span className="font-semibold text-stone-800">{stats && stats.orders ? stats.orders.confirmed || 0 : 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-100" />
                <span className="text-stone-600">Packing</span>
              </div>
              <span className="font-semibold text-stone-800">{stats && stats.orders ? stats.orders.packing || 0 : 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-100" />
                <span className="text-stone-600">Ready for Pickup</span>
              </div>
              <span className="font-semibold text-stone-800">{stats && stats.orders ? stats.orders.ready_for_pickup || 0 : 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-100" />
                <span className="text-stone-600">Out for Delivery</span>
              </div>
              <span className="font-semibold text-stone-800">{stats && stats.orders ? stats.orders.out_for_delivery || 0 : 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-100" />
                <span className="text-stone-600">Completed</span>
              </div>
              <span className="font-semibold text-stone-800">{stats && stats.orders ? stats.orders.completed || 0 : 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
