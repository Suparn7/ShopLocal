import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@shared/schema";

export default function CustomerCart() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>(
    JSON.parse(localStorage.getItem("cart") || "[]")
  );

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cartItems.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeFromCart = (productId: number) => {
    const updatedCart = cartItems.filter((item) => item.product.id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.product.sellingPrice * item.quantity, 0);
  };

  const placeOrder = () => {
    toast({
      title: t("customer.orderPlaced"),
      description: t("customer.orderSuccessMessage"),
    });
    setCartItems([]);
    localStorage.removeItem("cart");
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold mb-2">{t("customer.cartEmpty")}</h2>
        <p className="text-muted-foreground">{t("customer.addItemsToCart")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-xl font-semibold mb-4">{t("customer.yourCart")}</h1>
      <div className="space-y-4">
        {cartItems.map((item) => (
          <Card key={item.product.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium">{item.product.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(item.product.sellingPrice)} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="icon"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                >
                  <i className="fas fa-minus"></i>
                </Button>
                <span>{item.quantity}</span>
                <Button
                  size="icon"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                >
                  <i className="fas fa-plus"></i>
                </Button>
                <Button variant="outline" onClick={() => removeFromCart(item.product.id)}>
                  {t("customer.remove")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-lg font-semibold">{t("customer.totalAmount")}: {formatCurrency(calculateTotal())}</span>
        <Button onClick={placeOrder}>{t("customer.placeOrder")}</Button>
      </div>
    </div>
  );
}