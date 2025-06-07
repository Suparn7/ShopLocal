import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { queryClient } from "@/lib/queryClient";
import { Shop } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface ShopContextProps {
  shops: Shop[];
  setShops: React.Dispatch<React.SetStateAction<Shop[]>>;
}

const ShopContext = createContext<ShopContextProps | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    console.log("ShopProvider rendered");
    
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);

  // Fetch shops
 // Fetch shops
 const { data: fetchedShops, isLoading, isError, error } = useQuery<Shop[]>({
    queryKey: ["/api/shops"],
    enabled: !!user, // Ensure the query runs only when the user is available
    onSuccess: (data) => {
      console.log("Fetched shops:", data); // Debugging log
      setShops(data);
    },
    onError: (err) => {
      console.error("Error fetching shops:", err); // Debugging log
    },
  });

  // Handle WebSocket events
  const handleSocketEvent = (event: string, data: any) => {
    if (event === "shop-added") {
      console.log("Shop added:", data);
      setShops((prevShops) => [...prevShops, data]);
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
    }

    if (event === "shop-updated") {
      console.log("Shop updated:", data);
      setShops((prevShops) =>
        prevShops.map((shop) =>
          shop.id === data.id ? { ...shop, ...data } : shop
        )
      );
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
    }

    if (event === "shop-deleted") {
      console.log("Shop deleted:", data);
      setShops((prevShops) =>
        prevShops.filter((shop) => shop.id !== data.shopId)
      );
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
    }

    if (event === "shop-toggled") {
      console.log("Shop toggled:", data);
      setShops((prevShops) =>
        prevShops.map((shop) =>
          shop.id === data.id ? { ...shop, isOpen: data.isOpen } : shop
        )
      );
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
    }
  };

  // Use the WebSocket hook
  useSocket(user?.id, user?.role, handleSocketEvent);

  return (
    <ShopContext.Provider value={{ shops, setShops }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShopContext = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShopContext must be used within a ShopProvider");
  }
  return context;
};