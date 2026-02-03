import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, Store, Leaf } from "lucide-react";
import { getCategories, getProducts, seedData } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useCart } from "../../context/CartContext";
import { toast } from "sonner";

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    const init = async () => {
      try {
        // Seed data on first load
        await seedData();
      } catch (e) {
        // Ignore if already seeded
      }
      
      try {
        const [catRes, prodRes] = await Promise.all([
          getCategories(),
          getProducts()
        ]);
        setCategories(catRes.data);
        setProducts(prodRes.data);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAddToCart = (product) => {
    if (product.stock_quantity <= 0) {
      toast.error("Product out of stock");
      return;
    }
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const categoryImages = {
    "Rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
    "Beans": "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=400&h=300&fit=crop",
    "Oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop",
    "Spices": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=300&fit=crop"
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#1B4D3E] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-xl">
            <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Quality Foodstuff, Delivered Fresh
            </h1>
            <p className="text-white/80 text-base md:text-lg mb-6">
              Your trusted source for premium rice, beans, oils, and spices in Lagos. Fresh from the market to your door.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/category/all">
                <Button 
                  size="lg" 
                  className="bg-[#C05621] hover:bg-[#a84a1c] text-white rounded-full px-6"
                  data-testid="shop-now-btn"
                >
                  Shop Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Features */}
        <div className="relative bg-white/10 backdrop-blur-sm border-t border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-1">
                <Store className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm">Store Pickup</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm">Home Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Leaf className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm">Fresh Quality</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1A202C]">
            Shop by Category
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              to={`/category/${category.id}`}
              className="group"
              data-testid={`category-${category.name.toLowerCase()}`}
            >
              <Card className="relative overflow-hidden rounded-xl h-40 md:h-48 border-0 shadow-md">
                <img 
                  src={categoryImages[category.name] || category.image_url || "https://images.unsplash.com/photo-1613758235256-43a7bdc21d82?w=400&h=300&fit=crop"}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-lg">{category.name}</h3>
                  <p className="text-white/70 text-sm">
                    {products.filter(p => p.category_id === category.id).length} items
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1A202C]">
            Popular Products
          </h2>
          <Link 
            to="/category/all" 
            className="text-[#1B4D3E] text-sm font-medium flex items-center gap-1 hover:underline"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, 8).map((product) => (
            <Card 
              key={product.id} 
              className="overflow-hidden border border-stone-200 bg-white rounded-xl hover:shadow-lg transition-shadow"
            >
              <Link to={`/product/${product.id}`} data-testid={`product-${product.id}`}>
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
      </section>

      {/* Store Info */}
      <section className="bg-[#1B4D3E]/5 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200">
            <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1A202C] mb-4">
              Visit Our Store
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-[#1A202C] mb-2">Business Hours</h3>
                <p className="text-stone-600">Monday - Saturday: 8:00 AM - 6:00 PM</p>
                <p className="text-stone-600">Sunday: Closed</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#1A202C] mb-2">Fulfillment Options</h3>
                <p className="text-stone-600">• Store Pickup (Free)</p>
                <p className="text-stone-600">• Home Delivery (Zone-based pricing)</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
