import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { getProduct, getProducts } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { useCart } from "../../context/CartContext";
import { toast } from "sonner";

const ProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const response = await getProduct(productId);
        setProduct(response.data);
        
        // Load related products from same category
        const relatedRes = await getProducts(response.data.category_id);
        setRelatedProducts(
          relatedRes.data.filter(p => p.id !== productId).slice(0, 4)
        );
      } catch (error) {
        console.error("Error loading product:", error);
        toast.error("Product not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
    setQuantity(1);
  }, [productId, navigate]);

  const handleAddToCart = () => {
    if (!product || product.stock_quantity <= 0) {
      toast.error("Product out of stock");
      return;
    }
    addItem(product, quantity);
    toast.success(`${quantity} x ${product.name} added to cart`);
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock_quantity) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-stone-600 hover:text-[#1B4D3E] mb-6 transition-colors"
        data-testid="back-btn"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back</span>
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="aspect-square bg-stone-100 rounded-2xl overflow-hidden relative">
          <img 
            src={product.image_url || "https://images.unsplash.com/photo-1613758235256-43a7bdc21d82?w=600&h=600&fit=crop"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded-full font-medium">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <div className="mb-4">
            {isLowStock && (
              <Badge className="bg-amber-100 text-amber-800 mb-2">Low Stock</Badge>
            )}
            <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#1A202C] mb-2">
              {product.name}
            </h1>
            <p className="text-stone-500">per {product.unit}</p>
          </div>

          <div className="mb-6">
            <span className="text-3xl font-bold text-[#1B4D3E]">
              {formatCurrency(product.price)}
            </span>
          </div>

          {product.description && (
            <p className="text-stone-600 mb-6">{product.description}</p>
          )}

          {/* Stock Info */}
          <div className="mb-6 p-4 bg-stone-50 rounded-xl">
            <p className="text-sm text-stone-600">
              {isOutOfStock 
                ? "Currently unavailable" 
                : `${product.stock_quantity} in stock`}
            </p>
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-stone-600 font-medium">Quantity:</span>
              <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-1">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                  data-testid="quantity-minus"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold" data-testid="quantity-value">
                  {quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  disabled={quantity >= product.stock_quantity}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                  data-testid="quantity-plus"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full bg-[#1B4D3E] hover:bg-[#153d31] text-white py-6 rounded-xl text-lg font-semibold"
            data-testid="add-to-cart-btn"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {isOutOfStock ? "Out of Stock" : `Add to Cart - ${formatCurrency(product.price * quantity)}`}
          </Button>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1A202C] mb-6">
            Related Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((item) => (
              <Link key={item.id} to={`/product/${item.id}`}>
                <Card className="overflow-hidden border border-stone-200 bg-white rounded-xl hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-stone-100">
                    <img 
                      src={item.image_url || "https://images.unsplash.com/photo-1613758235256-43a7bdc21d82?w=300&h=300&fit=crop"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-[#1A202C] text-sm line-clamp-2 mb-1">
                      {item.name}
                    </h3>
                    <span className="font-bold text-[#1B4D3E]">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductPage;
