import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Eye, Truck, Store, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { adminGetOrders, updateOrderStatus } from "../../lib/api";
import { formatCurrency, formatDate, getStatusLabel, getStatusColor, getNextStatuses } from "../../lib/utils";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "sonner";

const AdminOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const res = await adminGetOrders();
      setOrders(res.data);
    } catch (e) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value) => {
    if (value === "all") { searchParams.delete("status"); }
    else { searchParams.set("status", value); }
    setSearchParams(searchParams);
  };

  const openModal = (order) => {
    setSelectedOrder(order);
    setNewStatus("");
    setRiderName(order.logistics_name || "");
    setRiderPhone(order.logistics_phone || "");
    setNotes(order.admin_notes || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleUpdate = async () => {
    if (!newStatus) { toast.error("Select a status"); return; }
    setUpdating(true);
    try {
      await updateOrderStatus(selectedOrder.id, { status: newStatus, logistics_name: riderName, logistics_phone: riderPhone, admin_notes: notes });
      toast.success("Status updated");
      closeModal();
      loadOrders();
    } catch (e) {
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const filtered = orders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!o.order_number.toLowerCase().includes(s) && !o.customer_name.toLowerCase().includes(s) && !o.customer_phone.includes(search)) return false;
    }
    return true;
  });

  if (loading) {
    return (<div className="space-y-6"><Skeleton className="h-10 w-full max-w-md" /><Skeleton className="h-96 rounded-xl" /></div>);
  }

  const orderItems = selectedOrder?.items || [];
  const nextStatuses = selectedOrder ? getNextStatuses(selectedOrder.status, selectedOrder.fulfillment_type) : [];
  const isPickup = selectedOrder?.fulfillment_type === "pickup";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-800">Orders</h1>
        <div className="flex gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-10" data-testid="order-search" />
          </div>
          <Select value={statusFilter || "all"} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-48" data-testid="status-filter"><SelectValue placeholder="Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="packing">Packing</SelectItem>
              <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Order</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-stone-500">No orders</td></tr>
              ) : (
                filtered.map(order => {
                  const orderIsPickup = order.fulfillment_type === "pickup";
                  return (
                    <tr key={order.id} className="border-b border-stone-100 hover:bg-stone-50" data-testid={`order-row-${order.order_number}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-800">{order.order_number}</p>
                        <p className="text-xs text-stone-500">{order.items.length} items</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-stone-800">{order.customer_name}</p>
                        <p className="text-xs text-stone-500">{order.customer_phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {orderIsPickup ? <Store className="w-4 h-4 text-stone-500" /> : <Truck className="w-4 h-4 text-stone-500" />}
                          <span className="text-sm">{orderIsPickup ? "Pickup" : "Delivery"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-800">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3"><Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge></td>
                      <td className="px-4 py-3 text-sm text-stone-500">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => openModal(order)} className="text-emerald-800 border-emerald-800" data-testid={`view-order-${order.order_number}`}>
                          <Eye className="w-4 h-4 mr-1" />View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-xl">Order {selectedOrder?.order_number}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                <div>
                  <p className="text-sm text-stone-500">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>{getStatusLabel(selectedOrder.status)}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-500">Total</p>
                  <p className="text-xl font-bold text-emerald-800">{formatCurrency(selectedOrder.total)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-stone-800 mb-2">Customer</h3>
                <p>{selectedOrder.customer_name}</p>
                <p className="text-stone-500">{selectedOrder.customer_phone}</p>
              </div>

              <div>
                <h3 className="font-semibold text-stone-800 mb-2">Fulfillment</h3>
                {isPickup ? (
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-emerald-800" />
                    <span>Pickup {selectedOrder.pickup_time ? `at ${selectedOrder.pickup_time}` : ""}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Truck className="w-5 h-5 text-emerald-800" />
                    <div>
                      <p>Delivery to {selectedOrder.delivery_zone_name}</p>
                      <p className="text-sm text-stone-500">{selectedOrder.delivery_address}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-stone-800 mb-2">Items</h3>
                {orderItems.map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-stone-100">
                    <span>{item.quantity}x {item.product_name}</span>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-bold text-lg">
                  <span>Total</span>
                  <span className="text-emerald-800">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Payment Proof Section */}
              <div>
                <h3 className="font-semibold text-stone-800 mb-2">Payment Proof</h3>
                {selectedOrder.payment_proof_url ? (
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center gap-3">
                      {selectedOrder.payment_proof_url.endsWith(".pdf") ? (
                        <FileText className="w-8 h-8 text-emerald-600" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-emerald-600" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-emerald-800">Payment proof uploaded</p>
                        <p className="text-sm text-emerald-600">Customer has submitted proof of payment</p>
                      </div>
                      <a
                        href={`${process.env.REACT_APP_BACKEND_URL}${selectedOrder.payment_proof_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900"
                        data-testid="view-payment-proof"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-amber-700 text-sm">No payment proof uploaded yet</p>
                  </div>
                )}
              </div>

              {nextStatuses.length > 0 && (
                <div className="border-t border-stone-200 pt-6">
                  <h3 className="font-semibold text-stone-800 mb-4">Update Status</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>New Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="mt-1" data-testid="update-status-select"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          {nextStatuses.map(s => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {newStatus === "out_for_delivery" && (
                      <>
                        <div>
                          <Label>Rider Name</Label>
                          <Input value={riderName} onChange={e => setRiderName(e.target.value)} placeholder="Rider name" className="mt-1" data-testid="logistics-name" />
                        </div>
                        <div>
                          <Label>Rider Phone</Label>
                          <Input value={riderPhone} onChange={e => setRiderPhone(e.target.value)} placeholder="Rider phone" className="mt-1" data-testid="logistics-phone" />
                        </div>
                      </>
                    )}
                    <div>
                      <Label>Notes</Label>
                      <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" className="mt-1" rows={2} data-testid="admin-notes" />
                    </div>
                    <Button onClick={handleUpdate} disabled={updating || !newStatus} className="w-full bg-emerald-800 hover:bg-emerald-900 text-white" data-testid="update-status-btn">
                      {updating ? "Updating..." : "Update Status"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
