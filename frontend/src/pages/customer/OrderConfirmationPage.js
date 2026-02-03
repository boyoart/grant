import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, Copy, Clock, Store, Truck, CreditCard } from "lucide-react";
import { getOrder, getSettings } from "../../lib/api";
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "sonner";

function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const orderRes = await getOrder(orderNumber);
        const settingsRes = await getSettings();
        setOrder(orderRes.data);
        setSettings(settingsRes.data);
      } catch (error) {
        toast.error("Order not found");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orderNumber]);

  function copyText(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied");
    setTimeout(function() { setCopied(false); }, 2000);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Skeleton className="h-48 w-full rounded-xl mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-stone-800 mb-4">Order Not Found</h1>
        <Link to="/">
          <Button className="bg-emerald-800 hover:bg-emerald-900 text-white">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const isPending = order.status === "pending_payment";
  const bankName = settings ? (settings.bank_name || "First Bank") : "First Bank";
  const accountNum = settings ? (settings.account_number || "3012345678") : "3012345678";
  const accountName = settings ? (settings.account_name || "FoodNova Enterprises") : "FoodNova Enterprises";

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {isPending ? (
        <Card className="p-6 bg-emerald-800 text-white rounded-2xl mb-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">Order Placed!</h1>
          <p className="text-white/80">Please complete payment</p>
        </Card>
      ) : (
        <Card className="p-6 bg-white border border-stone-200 rounded-2xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-stone-800">Order {order.order_number}</h1>
              <p className="text-stone-500 text-sm">{formatDate(order.created_at)}</p>
            </div>
            <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
          </div>
        </Card>
      )}

      {isPending && settings ? (
        <Card className="p-6 bg-white border-2 border-amber-200 rounded-2xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-semibold text-lg text-stone-800">Payment Instructions</h2>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 mb-4">
            <p className="text-amber-800 text-sm">Transfer to the account below using your Order ID as reference.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-stone-50 rounded-xl">
              <p className="text-sm text-stone-500">Bank Name</p>
              <p className="font-semibold text-stone-800">{bankName}</p>
            </div>

            <div className="flex justify-between items-center p-4 bg-stone-50 rounded-xl">
              <div>
                <p className="text-sm text-stone-500">Account Number</p>
                <p className="font-semibold text-stone-800 text-lg">{accountNum}</p>
              </div>
              <Button variant="outline" size="sm" onClick={function() { copyText(accountNum); }} data-testid="copy-account-btn">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl">
              <p className="text-sm text-stone-500">Account Name</p>
              <p className="font-semibold text-stone-800">{accountName}</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
              <p className="text-sm text-emerald-700">Amount to Pay</p>
              <p className="font-bold text-emerald-800 text-2xl">{formatCurrency(order.total)}</p>
            </div>

            <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
              <div>
                <p className="text-sm text-orange-700">Transfer Reference</p>
                <p className="font-bold text-orange-800 text-xl">{order.order_number}</p>
              </div>
              <Button variant="outline" size="sm" onClick={function() { copyText(order.order_number); }} data-testid="copy-order-btn">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-stone-500 mt-4 text-center">We'll confirm once payment is verified.</p>
        </Card>
      ) : null}

      <Card className="p-6 bg-white border border-stone-200 rounded-2xl mb-6">
        <h2 className="font-semibold text-lg text-stone-800 mb-4">Order Details</h2>

        <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl mb-4">
          {order.fulfillment_type === "pickup" ? (
            <React.Fragment>
              <Store className="w-5 h-5 text-emerald-800" />
              <div>
                <p className="font-medium text-stone-800">Store Pickup</p>
                <p className="text-sm text-stone-500">{order.pickup_time || "Time TBD"}</p>
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Truck className="w-5 h-5 text-emerald-800" />
              <div>
                <p className="font-medium text-stone-800">Delivery to {order.delivery_zone_name}</p>
                <p className="text-sm text-stone-500">{order.delivery_address}</p>
              </div>
            </React.Fragment>
          )}
        </div>

        <div className="space-y-3 mb-4">
          {order.items.map(function(item, i) {
            return (
              <div key={i} className="flex justify-between text-sm py-2 border-b border-stone-100">
                <span className="text-stone-600">{item.quantity}x {item.product_name}</span>
                <span className="font-medium text-stone-800">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            );
          })}
        </div>

        <div className="border-t border-stone-200 pt-4 space-y-2">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Delivery</span>
            <span>{order.delivery_fee > 0 ? formatCurrency(order.delivery_fee) : "FREE"}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-stone-800 pt-2">
            <span>Total</span>
            <span className="text-emerald-800">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white border border-stone-200 rounded-2xl mb-6">
        <h2 className="font-semibold text-lg text-stone-800 mb-4">Customer</h2>
        <p className="text-stone-600"><span className="font-medium text-stone-800">Name:</span> {order.customer_name}</p>
        <p className="text-stone-600"><span className="font-medium text-stone-800">Phone:</span> {order.customer_phone}</p>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/orders" className="flex-1">
          <Button variant="outline" className="w-full border-stone-300 text-stone-600" data-testid="view-orders-btn">
            <Clock className="w-4 h-4 mr-2" />View Orders
          </Button>
        </Link>
        <Link to="/" className="flex-1">
          <Button className="w-full bg-emerald-800 hover:bg-emerald-900 text-white" data-testid="continue-shopping-btn">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default OrderConfirmationPage;
