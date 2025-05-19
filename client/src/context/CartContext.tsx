import React, { createContext, useContext, useState } from "react";
import { Product, Shop } from "@shared/schema";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextProps {
  cartItems: CartItem[];
  shop: Shop | null;
  setShop: (shop: Shop | null) => void;
  addToCart: (product: Product) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  calculateTotal: () => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setCartItems((prev) =>
      quantity <= 0
        ? prev.filter((item) => item.product.id !== productId)
        : prev.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          )
    );
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.product.sellingPrice * item.quantity,
      0
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setShop(null);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        shop,
        setShop,
        addToCart,
        updateQuantity,
        removeFromCart,
        calculateTotal,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};