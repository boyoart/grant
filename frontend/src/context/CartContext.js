import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("foodnova_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.error("Error loading cart:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage when items change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("foodnova_cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock_quantity) }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        unit: product.unit,
        quantity: Math.min(quantity, product.stock_quantity),
        stock_quantity: product.stock_quantity
      }];
    });
  };

  const removeItem = (productId) => {
    setItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product_id === productId
          ? { ...item, quantity: Math.min(quantity, item.stock_quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getSubtotal,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
