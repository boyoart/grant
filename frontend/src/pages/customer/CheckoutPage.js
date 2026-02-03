import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, Truck, Check } from "lucide-react";
import { getDeliveryZones, getSettings, createOrder } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCart();
  const { customer, isCustomer } = useAuth();
  
  const [fulfillmentType, setFulfillmentType] = useState("pickup");
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pickupTime: "",
    deliveryZoneId: "",
    deliveryAddress: "",
    deliveryNote: ""
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
      return;
    }

    const loadData = async () => {
      try {
        const [zonesRes, settingsRes] = await Promise.all([
          getDeliveryZones(),
          getSettings()
        ]);
        setDeliveryZones(zonesRes.data);
        setSettings(settingsRes.data);
        
        // Pre-fill customer data
        if (customer) {
          setFormData(prev => ({
            ...prev,
            name: customer.name || "",
            phone: customer.phone || ""
          }));
        }
      } catch (error) {
        console.error("Error loading checkout data:", error);
        toast.error("Failed to load checkout data");
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [items.length, navigate, customer]);

  const subtotal = getSubtotal();
  const selectedZone = deliveryZones.find(z => z.id === formData.deliveryZoneId);
  const deliveryFee = fulfillmentType === "delivery" && selectedZone ? selectedZone.fee : 0;
  const total = subtotal + deliveryFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (fulfillmentType === "pickup" && !formData.pickupTime) {
      toast.error("Please select a pickup time");
      return;
    }
    if (fulfillmentType === "delivery") {
      if (!formData.deliveryZoneId) {
        toast.error("Please select a delivery zone");
        return;
      }
      if (!formData.deliveryAddress.trim()) {
        toast.error("Please enter your delivery address");
        return;
      }
    }

    setLoading(true);
    try {
      const orderData = {
        customer_name: formData.name,
        customer_phone: formData.phone,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit
        })),
        fulfillment_type: fulfillmentType,
        pickup_time: fulfillmentType === "pickup" ? formData.pickupTime : null,
        delivery_zone_id: fulfillmentType === "delivery" ? formData.deliveryZoneId : null,
        delivery_address: fulfillmentType === "delivery" ? formData.deliveryAddress : null,
        delivery_note: fulfillmentType === "delivery" ? formData.deliveryNote : null
      };

      const response = await createOrder(orderData);
      clearCart();
      navigate(`/order/${response.data.order.order_number}`);
      toast.success("Order placed successfully!");
    } catch (error) {
      console.error("Error creating order:", error);
      const errorMsg = error.response?.data?.detail || "Failed to place order";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#1B4D3E] border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-stone-500">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-stone-600" />
        </button>
        <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1A202C]">
          Checkout
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <Card className="p-6 bg-white border border-stone-200 rounded-xl">
              <h2 className="font-semibold text-lg text-[#1A202C] mb-4">Your Details</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="mt-1"
                    data-testid="checkout-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., 08012345678"
                    className="mt-1"
                    data-testid="checkout-phone"
                  />
                  {!isCustomer && (
                    <p className="text-xs text-stone-500 mt-1">
                      You can also <a href="/login" className="text-[#1B4D3E] underline">login</a> to save your order history
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Fulfillment Type */}
            <Card className="p-6 bg-white border border-stone-200 rounded-xl">
              <h2 className="font-semibold text-lg text-[#1A202C] mb-4">Fulfillment Method</h2>
              
              <RadioGroup 
                value={fulfillmentType} 
                onValueChange={setFulfillmentType}
                className="space-y-3"
              >
                <label 
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    fulfillmentType === "pickup" 
                      ? "border-[#1B4D3E] bg-[#1B4D3E]/5" 
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                  data-testid="fulfillment-pickup"
                >
                  <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    fulfillmentType === "pickup" ? "bg-[#1B4D3E] text-white" : "bg-stone-100 text-stone-600"
                  }`}>
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#1A202C]">Store Pickup</p>
                    <p className="text-sm text-stone-500">Pick up your order at our store</p>
                  </div>
                  <span className="font-semibold text-green-600">FREE</span>
                  {fulfillmentType === "pickup" && (
                    <Check className="w-5 h-5 text-[#1B4D3E]" />
                  )}
                </label>

                <label 
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    fulfillmentType === "delivery" 
                      ? "border-[#1B4D3E] bg-[#1B4D3E]/5" 
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                  data-testid="fulfillment-delivery"
                >
                  <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    fulfillmentType === "delivery" ? "bg-[#1B4D3E] text-white" : "bg-stone-100 text-stone-600"
                  }`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#1A202C]">Home Delivery</p>
                    <p className="text-sm text-stone-500">We'll deliver to your doorstep</p>
                  </div>
                  <span className="font-semibold text-[#C05621]">
                    {selectedZone ? formatCurrency(selectedZone.fee) : "Zone-based"}
                  </span>
                  {fulfillmentType === "delivery" && (
                    <Check className="w-5 h-5 text-[#1B4D3E]" />
                  )}
                </label>
              </RadioGroup>

              {/* Pickup Time Selection */}
              {fulfillmentType === "pickup" && settings?.pickup_slots?.length > 0 && (
                <div className="mt-6">
                  <Label>Select Pickup Time *</Label>
                  <Select 
                    value={formData.pickupTime} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, pickupTime: value }))}
                  >
                    <SelectTrigger className="mt-1" data-testid="pickup-time-select">
                      <SelectValue placeholder="Choose a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.pickup_slots.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-stone-500 mt-1">
                    Store hours: Monday - Saturday, 8:00 AM - 6:00 PM
                  </p>
                </div>
              )}

              {/* Delivery Details */}
              {fulfillmentType === "delivery" && (
                <div className="mt-6 space-y-4">
                  <div>
                    <Label>Delivery Zone *</Label>
                    <Select 
                      value={formData.deliveryZoneId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, deliveryZoneId: value }))}
                    >
                      <SelectTrigger className="mt-1" data-testid="delivery-zone-select">
                        <SelectValue placeholder="Select your area" />
                      </SelectTrigger>
                      <SelectContent>
                        {deliveryZones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name} - {formatCurrency(zone.fee)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                    <Textarea
                      id="deliveryAddress"
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleInputChange}
                      placeholder="Enter your full delivery address"
                      className="mt-1"
                      rows={3}
                      data-testid="delivery-address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryNote">Delivery Note (Optional)</Label>
                    <Textarea
                      id="deliveryNote"
                      name="deliveryNote"
                      value={formData.deliveryNote}
                      onChange={handleInputChange}
                      placeholder="Any special instructions for delivery"
                      className="mt-1"
                      rows={2}
                      data-testid="delivery-note"
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white border border-stone-200 rounded-xl sticky top-24">
              <h2 className="font-semibold text-lg text-[#1A202C] mb-4">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span className="text-stone-600 line-clamp-1 flex-1">
                      {item.quantity}x {item.product_name}
                    </span>
                    <span className="font-medium ml-2">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-200 pt-4 space-y-3">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Fee</span>
                  <span>
                    {fulfillmentType === "pickup" 
                      ? "FREE" 
                      : selectedZone 
                        ? formatCurrency(deliveryFee) 
                        : "Select zone"}
                  </span>
                </div>
              </div>
              
              <div className="border-t border-stone-200 pt-4 mt-4">
                <div className="flex justify-between text-xl font-bold text-[#1A202C]">
                  <span>Total</span>
                  <span className="text-[#1B4D3E]">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-[#1B4D3E] hover:bg-[#153d31] text-white py-6 rounded-xl text-lg font-semibold"
                data-testid="place-order-btn"
              >
                {loading ? "Processing..." : "Place Order"}
              </Button>
              
              <p className="text-xs text-stone-500 mt-3 text-center">
                Payment via bank transfer. Instructions will be shown after order.
              </p>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
