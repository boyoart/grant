import { useState, useEffect } from "react";
import { Package, AlertTriangle, Plus, Minus, History } from "lucide-react";
import { adminGetProducts, adjustStock, getStockLogs, getLowStockProducts } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/utils";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "sonner";

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustment, setAdjustment] = useState({
    quantity: "",
    reason: "restock",
    type: "add"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, lowStockRes, logsRes] = await Promise.all([
        adminGetProducts(),
        getLowStockProducts(),
        getStockLogs()
      ]);
      setProducts(productsRes.data.filter(p => p.is_active));
      setLowStockProducts(lowStockRes.data);
      setStockLogs(logsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    setAdjustment({ quantity: "", reason: "restock", type: "add" });
    setShowAdjustModal(true);
  };

  const openLogsModal = async (product) => {
    setSelectedProduct(product);
    try {
      const response = await getStockLogs(product.id);
      setStockLogs(response.data);
      setShowLogsModal(true);
    } catch (error) {
      console.error("Error loading logs:", error);
      toast.error("Failed to load stock history");
    }
  };

  const handleAdjust = async () => {
    if (!adjustment.quantity || parseInt(adjustment.quantity) === 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const quantity = parseInt(adjustment.quantity);
    const quantityChange = adjustment.type === "add" ? quantity : -quantity;
    
    // Validate we're not going negative
    if (selectedProduct.stock_quantity + quantityChange < 0) {
      toast.error("Cannot reduce stock below zero");
      return;
    }

    setAdjusting(true);
    try {
      await adjustStock({
        product_id: selectedProduct.id,
        quantity_change: quantityChange,
        reason: adjustment.reason
      });
      
      toast.success("Stock adjusted successfully");
      setShowAdjustModal(false);
      loadData();
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error("Failed to adjust stock");
    } finally {
      setAdjusting(false);
    }
  };

  const reasonLabels = {
    restock: "Restock",
    sale: "Sale",
    damage: "Damage",
    adjustment: "Adjustment"
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
    <div className="space-y-6">
      <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1A202C]">
        Inventory Management
      </h1>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-amber-800">
              {lowStockProducts.length} Products Need Restocking
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((product) => (
              <div 
                key={product.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg"
              >
                <div>
                  <p className="font-medium text-[#1A202C] text-sm">{product.name}</p>
                  <p className="text-xs text-amber-600">{product.stock_quantity} left (threshold: {product.low_stock_threshold})</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => openAdjustModal(product)}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  data-testid={`restock-${product.id}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">All Products</TabsTrigger>
          <TabsTrigger value="history">Stock History</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full admin-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Current Stock</th>
                    <th className="px-4 py-3">Low Threshold</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} data-testid={`inventory-row-${product.id}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1A202C]">{product.name}</p>
                        <p className="text-xs text-stone-500">{product.unit}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-lg font-semibold ${
                          product.stock_quantity <= product.low_stock_threshold 
                            ? "text-amber-600" 
                            : "text-[#1A202C]"
                        }`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {product.low_stock_threshold}
                      </td>
                      <td className="px-4 py-3">
                        {product.stock_quantity <= 0 ? (
                          <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
                        ) : product.stock_quantity <= product.low_stock_threshold ? (
                          <Badge className="bg-amber-100 text-amber-800">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustModal(product)}
                            className="text-[#1B4D3E] border-[#1B4D3E]"
                            data-testid={`adjust-stock-${product.id}`}
                          >
                            <Package className="w-4 h-4 mr-1" />
                            Adjust
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openLogsModal(product)}
                            data-testid={`view-logs-${product.id}`}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full admin-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Change</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">By</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-stone-500">
                        No stock history found
                      </td>
                    </tr>
                  ) : (
                    stockLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 text-sm text-stone-500">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#1A202C]">
                          {log.product_name}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${
                            log.quantity_change > 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {log.quantity_change > 0 ? "+" : ""}{log.quantity_change}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">
                            {reasonLabels[log.reason] || log.reason}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {log.admin_name || "System"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Stock Modal */}
      <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Playfair_Display'] text-xl">
              Adjust Stock
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 rounded-lg">
                <p className="font-medium text-[#1A202C]">{selectedProduct.name}</p>
                <p className="text-sm text-stone-500">
                  Current Stock: <span className="font-semibold">{selectedProduct.stock_quantity}</span>
                </p>
              </div>

              <div>
                <Label>Action Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button
                    type="button"
                    variant={adjustment.type === "add" ? "default" : "outline"}
                    onClick={() => setAdjustment(prev => ({ ...prev, type: "add" }))}
                    className={adjustment.type === "add" ? "bg-green-600 hover:bg-green-700" : ""}
                    data-testid="adjust-add-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stock
                  </Button>
                  <Button
                    type="button"
                    variant={adjustment.type === "remove" ? "default" : "outline"}
                    onClick={() => setAdjustment(prev => ({ ...prev, type: "remove" }))}
                    className={adjustment.type === "remove" ? "bg-red-600 hover:bg-red-700" : ""}
                    data-testid="adjust-remove-btn"
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Remove Stock
                  </Button>
                </div>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={adjustment.quantity}
                  onChange={(e) => setAdjustment(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity"
                  className="mt-1"
                  min="1"
                  data-testid="adjust-quantity-input"
                />
              </div>

              <div>
                <Label>Reason</Label>
                <Select 
                  value={adjustment.reason} 
                  onValueChange={(value) => setAdjustment(prev => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger className="mt-1" data-testid="adjust-reason-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restock">Restock</SelectItem>
                    <SelectItem value="damage">Damage/Loss</SelectItem>
                    <SelectItem value="adjustment">Inventory Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {adjustment.quantity && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    New Stock: <span className="font-bold">
                      {adjustment.type === "add" 
                        ? selectedProduct.stock_quantity + parseInt(adjustment.quantity || 0)
                        : selectedProduct.stock_quantity - parseInt(adjustment.quantity || 0)}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdjust}
                  disabled={adjusting}
                  className="flex-1 bg-[#1B4D3E] hover:bg-[#153d31] text-white"
                  data-testid="confirm-adjust-btn"
                >
                  {adjusting ? "Saving..." : "Confirm"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Logs Modal */}
      <Dialog open={showLogsModal} onOpenChange={setShowLogsModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Playfair_Display'] text-xl">
              Stock History - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {stockLogs.length === 0 ? (
              <p className="text-center py-8 text-stone-500">No history found</p>
            ) : (
              stockLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <p className="text-sm text-stone-500">{formatDate(log.created_at)}</p>
                    <p className="text-sm text-stone-600">{reasonLabels[log.reason] || log.reason}</p>
                  </div>
                  <span className={`font-bold ${log.quantity_change > 0 ? "text-green-600" : "text-red-600"}`}>
                    {log.quantity_change > 0 ? "+" : ""}{log.quantity_change}
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInventory;
