import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, MapPin } from "lucide-react";
import { adminGetDeliveryZones, createDeliveryZone, updateDeliveryZone, deleteDeliveryZone } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "sonner";

const AdminZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    fee: "",
    is_active: true
  });

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const response = await adminGetDeliveryZones();
      setZones(response.data);
    } catch (error) {
      console.error("Error loading zones:", error);
      toast.error("Failed to load delivery zones");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setSelectedZone(null);
    setFormData({ name: "", fee: "", is_active: true });
    setShowModal(true);
  };

  const openEditModal = (zone) => {
    setSelectedZone(zone);
    setFormData({
      name: zone.name,
      fee: zone.fee.toString(),
      is_active: zone.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.fee) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formData.name,
        fee: parseFloat(formData.fee),
        is_active: formData.is_active
      };

      if (selectedZone) {
        await updateDeliveryZone(selectedZone.id, data);
        toast.success("Zone updated successfully");
      } else {
        await createDeliveryZone(data);
        toast.success("Zone created successfully");
      }
      
      setShowModal(false);
      loadZones();
    } catch (error) {
      console.error("Error saving zone:", error);
      toast.error("Failed to save zone");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (zone) => {
    try {
      await updateDeliveryZone(zone.id, { is_active: !zone.is_active });
      toast.success(`Zone ${zone.is_active ? "deactivated" : "activated"}`);
      loadZones();
    } catch (error) {
      console.error("Error updating zone:", error);
      toast.error("Failed to update zone");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeliveryZone(selectedZone.id);
      toast.success("Zone deleted successfully");
      setShowDeleteDialog(false);
      loadZones();
    } catch (error) {
      console.error("Error deleting zone:", error);
      toast.error("Failed to delete zone");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1A202C]">
            Delivery Zones
          </h1>
          <p className="text-stone-500 mt-1">Manage delivery areas and fees</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="bg-[#1B4D3E] hover:bg-[#153d31] text-white"
          data-testid="add-zone-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Zone
        </Button>
      </div>

      {/* Zones Grid */}
      {zones.length === 0 ? (
        <Card className="p-12 text-center bg-white border border-stone-200 rounded-xl">
          <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#1A202C] mb-2">No Delivery Zones</h3>
          <p className="text-stone-500 mb-4">Add delivery zones to enable home delivery</p>
          <Button onClick={openAddModal} className="bg-[#1B4D3E] hover:bg-[#153d31] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add First Zone
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <Card 
              key={zone.id} 
              className={`p-4 bg-white border rounded-xl ${
                zone.is_active ? "border-stone-200" : "border-stone-100 bg-stone-50"
              }`}
              data-testid={`zone-card-${zone.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    zone.is_active ? "bg-[#1B4D3E]/10" : "bg-stone-100"
                  }`}>
                    <MapPin className={`w-5 h-5 ${zone.is_active ? "text-[#1B4D3E]" : "text-stone-400"}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${zone.is_active ? "text-[#1A202C]" : "text-stone-400"}`}>
                      {zone.name}
                    </h3>
                    <p className={`text-lg font-bold ${zone.is_active ? "text-[#1B4D3E]" : "text-stone-400"}`}>
                      {formatCurrency(zone.fee)}
                    </p>
                  </div>
                </div>
                <Badge className={zone.is_active ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-500"}>
                  {zone.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={zone.is_active}
                    onCheckedChange={() => handleToggleActive(zone)}
                    data-testid={`toggle-zone-${zone.id}`}
                  />
                  <span className="text-sm text-stone-500">
                    {zone.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(zone)}
                    data-testid={`edit-zone-${zone.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setSelectedZone(zone);
                      setShowDeleteDialog(true);
                    }}
                    data-testid={`delete-zone-${zone.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Playfair_Display'] text-xl">
              {selectedZone ? "Edit Delivery Zone" : "Add Delivery Zone"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Zone Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Lagos Island"
                className="mt-1"
                data-testid="zone-name-input"
              />
            </div>

            <div>
              <Label>Delivery Fee (₦) *</Label>
              <Input
                type="number"
                value={formData.fee}
                onChange={(e) => setFormData(prev => ({ ...prev, fee: e.target.value }))}
                placeholder="e.g., 1500"
                className="mt-1"
                min="0"
                data-testid="zone-fee-input"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                data-testid="zone-active-switch"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#1B4D3E] hover:bg-[#153d31] text-white"
                data-testid="save-zone-btn"
              >
                {saving ? "Saving..." : selectedZone ? "Update Zone" : "Add Zone"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedZone?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              data-testid="confirm-delete-zone-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminZones;
