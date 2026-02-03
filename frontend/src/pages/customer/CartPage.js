import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { useCart } from "../../context/CartContext";

const CartPage = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getSubtotal, clearCart } = useCart();

  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-stone-400" />
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1A202C] mb-2">
            Your Cart is Empty
          </h1>
          <p className="text-stone-500 mb-6">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link to="/">
            <Button 
              className="bg-[#1B4D3E] hover:bg-[#153d31] text-white rounded-lg px-6"
              data-testid="continue-shopping-btn"
            >
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1A202C]">
            Shopping Cart
          </h1>
        </div>
        <Button
          variant="ghost"
          onClick={clearCart}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          data-testid="clear-cart-btn"
        >
          Clear All
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card 
              key={item.product_id} 
              className="p-4 bg-white border border-stone-200 rounded-xl"
              data-testid={`cart-item-${item.product_id}`}
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1613758235256-43a7bdc21d82?w=100&h=100&fit=crop"
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-[#1A202C] line-clamp-2">
                        {item.product_name}
                      </h3>
                      <p className="text-sm text-stone-500">per {item.unit}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                      data-testid={`remove-item-${item.product_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-white transition-colors"
                        data-testid={`decrease-${item.product_id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_quantity}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-white transition-colors disabled:opacity-50"
                        data-testid={`increase-${item.product_id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-[#1B4D3E]">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-white border border-stone-200 rounded-xl sticky top-24">
            <h2 className="font-semibold text-lg text-[#1A202C] mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal ({items.length} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery</span>
                <span className="text-sm">Calculated at checkout</span>
              </div>
            </div>
            
            <div className="border-t border-stone-200 pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold text-[#1A202C]">
                <span>Total</span>
                <span className="text-[#1B4D3E]">{formatCurrency(subtotal)}</span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Delivery fee will be added based on your location
              </p>
            </div>

            <Link to="/checkout">
              <Button 
                className="w-full bg-[#1B4D3E] hover:bg-[#153d31] text-white py-6 rounded-xl text-lg font-semibold"
                data-testid="checkout-btn"
              >
                Proceed to Checkout
              </Button>
            </Link>
            
            <Link to="/" className="block mt-4">
              <Button 
                variant="outline" 
                className="w-full border-stone-300 text-stone-600 rounded-xl"
              >
                Continue Shopping
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
