import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getCategories, getProducts } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useCart } from "../../context/CartContext";
import { toast } from "sonner";

const CategoryPage = () => {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          getCategories(),
          categoryId === "all" ? getProducts() : getProducts(categoryId)
        ]);
        setAllCategories(catRes.data);
        
        if (categoryId === "all") {
          setCategory({ name: "All Products", description: "Browse our full catalog" });
          setProducts(prodRes.data);
        } else {
          const foundCat = catRes.data.find(c => c.id === categoryId);
          setCategory(foundCat);
          setProducts(prodRes.data);
        }
      } catch (error) {
        console.error("Error loading category:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [categoryId]);

  const handleAddToCart = (product) => {
    if (product.stock_quantity <= 0) {
      toast.error("Product out of stock");
      return;
    }
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-stone-600" />
        </Link>
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1A202C]">
            {category?.name || "Products"}
          </h1>
          {category?.description && (
            <p className="text-stone-500 text-sm mt-1">{category.description}</p>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4 scrollbar-hide">
        <Link to="/category/all">
          <Button
            variant={categoryId === "all" ? "default" : "outline"}
            className={`rounded-full whitespace-nowrap ${
              categoryId === "all" 
                ? "bg-[#1B4D3E] hover:bg-[#153d31]" 
                : "border-stone-300 text-stone-600"
            }`}
            data-testid="filter-all"
          >
            All
          </Button>
        </Link>
        {allCategories.map(cat => (
          <Link key={cat.id} to={`/category/${cat.id}`}>
            <Button
              variant={categoryId === cat.id ? "default" : "outline"}
              className={`rounded-full whitespace-nowrap ${
                categoryId === cat.id 
                  ? "bg-[#1B4D3E] hover:bg-[#153d31]" 
                  : "border-stone-300 text-stone-600"
              }`}
              data-testid={`filter-${cat.name.toLowerCase()}`}
            >
              {cat.name}
            </Button>
          </Link>
        ))}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-stone-500">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className="overflow-hidden border border-stone-200 bg-white rounded-xl hover:shadow-lg transition-shadow"
            >
              <Link to={`/product/${product.id}`} data-testid={`product-card-${product.id}`}>
                <div className="aspect-square bg-stone-100 relative">
                  <img 
                    src={product.image_url || "https://images.unsplash.com/photo-1613758235256-43a7bdc21d82?w=300&h=300&fit=crop"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.stock_quantity <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  {product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                      Low Stock
                    </span>
                  )}
                </div>
              </Link>
              <div className="p-3">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-medium text-[#1A202C] text-sm line-clamp-2 mb-1 hover:text-[#1B4D3E]">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-xs text-stone-500 mb-2">per {product.unit}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1B4D3E] text-lg">
                    {formatCurrency(product.price)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock_quantity <= 0}
                    className="bg-[#1B4D3E] hover:bg-[#153d31] text-white text-xs px-3 py-1 h-8 rounded-lg"
                    data-testid={`add-to-cart-${product.id}`}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
