import { useState, useEffect } from "react";
import { Save, Plus, X, Building, CreditCard, Clock, MessageSquare } from "lucide-react";
import { adminGetSettings, updateSettings } from "../../lib/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "sonner";

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSlot, setNewSlot] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await adminGetSettings();
      setSettings(response.data);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addPickupSlot = () => {
    if (!newSlot.trim()) return;
    setSettings(prev => ({
      ...prev,
      pickup_slots: [...(prev.pickup_slots || []), newSlot.trim()]
    }));
    setNewSlot("");
  };

  const removePickupSlot = (index) => {
    setSettings(prev => ({
      ...prev,
      pickup_slots: prev.pickup_slots.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1A202C]">
          Settings
        </h1>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1B4D3E] hover:bg-[#153d31] text-white"
          data-testid="save-settings-btn"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="bg-stone-100">
          <TabsTrigger value="store">Store Info</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
          <TabsTrigger value="pickup">Pickup Slots</TabsTrigger>
          <TabsTrigger value="sms">SMS Templates</TabsTrigger>
        </TabsList>

        {/* Store Info */}
        <TabsContent value="store">
          <Card className="p-6 bg-white border border-stone-200 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#1B4D3E]/10 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-[#1B4D3E]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1A202C]">Store Information</h2>
                <p className="text-sm text-stone-500">Basic store details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Store Name</Label>
                <Input
                  value={settings?.store_name || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                  placeholder="FoodNova"
                  className="mt-1"
                  data-testid="store-name-input"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Bank Details */}
        <TabsContent value="bank">
          <Card className="p-6 bg-white border border-stone-200 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#1B4D3E]/10 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#1B4D3E]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1A202C]">Bank Account Details</h2>
                <p className="text-sm text-stone-500">Payment collection account</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={settings?.bank_name || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, bank_name: e.target.value }))}
                  placeholder="e.g., First Bank"
                  className="mt-1"
                  data-testid="bank-name-input"
                />
              </div>

              <div>
                <Label>Account Number</Label>
                <Input
                  value={settings?.account_number || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, account_number: e.target.value }))}
                  placeholder="e.g., 3012345678"
                  className="mt-1"
                  data-testid="account-number-input"
                />
              </div>

              <div>
                <Label>Account Name</Label>
                <Input
                  value={settings?.account_name || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, account_name: e.target.value }))}
                  placeholder="e.g., FoodNova Enterprises"
                  className="mt-1"
                  data-testid="account-name-input"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Pickup Slots */}
        <TabsContent value="pickup">
          <Card className="p-6 bg-white border border-stone-200 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#1B4D3E]/10 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#1B4D3E]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1A202C]">Pickup Time Slots</h2>
                <p className="text-sm text-stone-500">Available pickup times for customers</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Existing Slots */}
              <div className="space-y-2">
                {settings?.pickup_slots?.length === 0 ? (
                  <p className="text-stone-500 text-sm">No pickup slots configured</p>
                ) : (
                  settings?.pickup_slots?.map((slot, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-stone-50 rounded-lg"
                    >
                      <span className="text-[#1A202C]">{slot}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePickupSlot(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        data-testid={`remove-slot-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Slot */}
              <div className="flex gap-2">
                <Input
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  placeholder="e.g., 9:00 AM - 10:00 AM"
                  className="flex-1"
                  data-testid="new-slot-input"
                />
                <Button
                  type="button"
                  onClick={addPickupSlot}
                  className="bg-[#1B4D3E] hover:bg-[#153d31] text-white"
                  data-testid="add-slot-btn"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* SMS Templates */}
        <TabsContent value="sms">
          <Card className="p-6 bg-white border border-stone-200 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#1B4D3E]/10 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#1B4D3E]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1A202C]">SMS Templates</h2>
                <p className="text-sm text-stone-500">Customize notification messages</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-1">Available Variables:</p>
                <p className="text-blue-600">
                  {"{order_id}"}, {"{total}"}, {"{bank_name}"}, {"{account_number}"}, {"{account_name}"}, {"{logistics_name}"}, {"{logistics_phone}"}
                </p>
              </div>

              <div>
                <Label>Order Placed</Label>
                <Textarea
                  value={settings?.sms_order_placed || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, sms_order_placed: e.target.value }))}
                  className="mt-1"
                  rows={3}
                  data-testid="sms-order-placed"
                />
              </div>

              <div>
                <Label>Payment Confirmed</Label>
                <Textarea
                  value={settings?.sms_payment_confirmed || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, sms_payment_confirmed: e.target.value }))}
                  className="mt-1"
                  rows={2}
                  data-testid="sms-payment-confirmed"
                />
              </div>

              <div>
                <Label>Ready for Pickup</Label>
                <Textarea
                  value={settings?.sms_ready_pickup || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, sms_ready_pickup: e.target.value }))}
                  className="mt-1"
                  rows={2}
                  data-testid="sms-ready-pickup"
                />
              </div>

              <div>
                <Label>Out for Delivery</Label>
                <Textarea
                  value={settings?.sms_out_for_delivery || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, sms_out_for_delivery: e.target.value }))}
                  className="mt-1"
                  rows={2}
                  data-testid="sms-out-for-delivery"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
