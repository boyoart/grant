import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, Copy, Clock, Store, Truck, CreditCard } from "lucide-react";
import { getOrder, getSettings } from "../../lib/api";
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "sonner";

const OrderConfirmationPage = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const [orderRes, settingsRes] = await Promise.all([
          getOrder(orderNumber),
          getSettings()
        ]);
        setOrder(orderRes.data);
        setSettings(settingsRes.data);
      } catch (error) {
        console.error("Error loading order:", error);
        toast.error("Order not found");
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [orderNumber]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

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
        <h1 className="text-2xl font-bold text-[#1A202C] mb-4">Order Not Found</h1>
        <Link to="/">
          <Button className="bg-[#1B4D3E] hover:bg-[#153d31] text-white">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const isPendingPayment = order.status === "pending_payment";

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Success Header */}
      {isPendingPayment && (
        <Card className="p-6 bg-[#1B4D3E] text-white rounded-2xl mb-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-white/80">
            Please complete payment to confirm your order
          </p>
        </Card>
      )}

      {/* Order Status (for returning visitors) */}
      {!isPendingPayment && (
        <Card className="p-6 bg-white border border-stone-200 rounded-2xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1A202C]">
                Order {order.order_number}
              </h1>
              <p className="text-stone-500 text-sm">{formatDate(order.created_at)}</p>
            </div>
            <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
              {getStatusLabel(order.status)}
            </Badge>
          </div>
        </Card>
      )}

      {/* Payment Instructions */}
      {isPendingPayment && settings && (
        <Card className="p-6 bg-white border-2 border-amber-200 rounded-2xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-semibold text-lg text-[#1A202C]">Payment Instructions</h2>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 mb-4">
            <p className="text-amber-800 text-sm">
              Please transfer the total amount to the bank account below and use your Order ID as the transfer narration/reference.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-stone-50 rounded-xl">
              <div>
                <p className="text-sm text-stone-500">Bank Name</p>
                <p className="font-semibold text-[#1A202C]">{settings.bank_name || "First Bank"}</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-stone-50 rounded-xl">
              <div>
                <p className="text-sm text-stone-500">Account Number</p>
                <p className="font-semibold text-[#1A202C] text-lg">{settings.account_number || "3012345678"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(settings.account_number || "3012345678")}
                className="text-[#1B4D3E] border-[#1B4D3E]"
                data-testid="copy-account-btn"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex justify-between items-center p-4 bg-stone-50 rounded-xl">
              <div>
                <p className="text-sm text-stone-500">Account Name</p>
                <p className="font-semibold text-[#1A202C]">{settings.account_name || "FoodNova Enterprises"}</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-[#1B4D3E]/10 rounded-xl border-2 border-[#1B4D3E]/30">
              <div>
                <p className="text-sm text-[#1B4D3E]">Amount to Pay</p>
                <p className="font-bold text-[#1B4D3E] text-2xl">{formatCurrency(order.total)}</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-[#C05621]/10 rounded-xl border-2 border-[#C05621]/30">
              <div>
                <p className="text-sm text-[#C05621]">Use as Transfer Reference/Narration</p>
                <p className="font-bold text-[#C05621] text-xl">{order.order_number}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(order.order_number)}
                className="text-[#C05621] border-[#C05621]"
                data-testid="copy-order-btn"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-stone-500 mt-4 text-center">
            Your order will be confirmed once we verify your payment.
          </p>
        </Card>
      )}

      {/* Order Details */}
      <Card className="p-6 bg-white border border-stone-200 rounded-2xl mb-6">
        <h2 className="font-semibold text-lg text-[#1A202C] mb-4">Order Details</h2>

        {/* Fulfillment Info */}
        <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl mb-4">
          {order.fulfillment_type === "pickup" ? (
            <>
              <Store className="w-5 h-5 text-[#1B4D3E]" />
              <div>
                <p className="font-medium text-[#1A202C]">Store Pickup</p>
                <p className="text-sm text-stone-500">
                  {order.pickup_time ? `Time: ${order.pickup_time}` : "Time to be confirmed"}
                </p>
              </div>
            </>
          ) : (
            <>
              <Truck className="w-5 h-5 text-[#1B4D3E]" />
              <div>
                <p className="font-medium text-[#1A202C]">Delivery to {order.delivery_zone_name}</p>
                <p className="text-sm text-stone-500">{order.delivery_address}</p>
              </div>
            </>
          )}
        </div>

        {/* Items */}
        <div className="space-y-3 mb-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm py-2 border-b border-stone-100 last:border-0">
              <span className="text-stone-600">
                {item.quantity}x {item.product_name}
              </span>
              <span className="font-medium text-[#1A202C]">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-stone-200 pt-4 space-y-2">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Delivery Fee</span>
            <span>{order.delivery_fee > 0 ? formatCurrency(order.delivery_fee) : "FREE"}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-[#1A202C] pt-2">
            <span>Total</span>
            <span className="text-[#1B4D3E]">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </Card>

      {/* Customer Info */}
      <Card className="p-6 bg-white border border-stone-200 rounded-2xl mb-6">
        <h2 className="font-semibold text-lg text-[#1A202C] mb-4">Customer Information</h2>
        <div className="space-y-2">
          <p className="text-stone-600">
            <span className="font-medium text-[#1A202C]">Name:</span> {order.customer_name}
          </p>
          <p className="text-stone-600">
            <span className="font-medium text-[#1A202C]">Phone:</span> {order.customer_phone}
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/orders" className="flex-1">
          <Button 
            variant="outline" 
            className="w-full border-stone-300 text-stone-600"
            data-testid="view-orders-btn"
          >
            <Clock className="w-4 h-4 mr-2" />
            View All Orders
          </Button>
        </Link>
        <Link to="/" className="flex-1">
          <Button 
            className="w-full bg-[#1B4D3E] hover:bg-[#153d31] text-white"
            data-testid="continue-shopping-btn"
          >
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
