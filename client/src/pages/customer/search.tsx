import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import CustomerLayout from "@/components/customer/layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ShopCard } from "@/components/customer/shop-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search as SearchIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Shop, Product } from "@shared/schema";

export default function CustomerSearch() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("shops");

  // Fetch shops
  const { data: shops, isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/shops"],
  });

  // Filtered shops based on search
  const filteredShops = shops?.filter(shop => 
    search.trim() === "" || 
    shop.name.toLowerCase().includes(search.toLowerCase()) ||
    shop.address?.toLowerCase().includes(search.toLowerCase()) ||
    shop.city?.toLowerCase().includes(search.toLowerCase())
  );

  // In a real app, you would have a separate API endpoint for products
  // For simplicity, we're using mock product data
  const mockProducts = [
    { 
      id: 1, 
      name: "Organic Tomatoes", 
      shopId: 1, 
      description: "Fresh organic tomatoes", 
      mrp: 30, 
      sellingPrice: 25, 
      stock: 100, 
      unit: "kg", 
      isAvailable: true 
    },
    { 
      id: 2, 
      name: "Whole Wheat Bread", 
      shopId: 2, 
      description: "Freshly baked whole wheat bread", 
      mrp: 40, 
      sellingPrice: 35, 
      stock: 20, 
      unit: "pcs", 
      isAvailable: true 
    },
    { 
      id: 3, 
      name: "Dairy Milk Chocolate", 
      shopId: 3, 
      description: "Cadbury Dairy Milk Chocolate", 
      mrp: 60, 
      sellingPrice: 55, 
      stock: 50, 
      unit: "pcs", 
      isAvailable: true 
    },
  ] as Product[];

  // Filtered products based on search
  const filteredProducts = mockProducts.filter(product => 
    search.trim() === "" || 
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.description?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    document.title = `${t("common.search")} - ShopLocal`;
  }, [t]);

  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-4 pb-20">
        <div className="relative mb-4">
          <Input 
            type="text" 
            placeholder={t("customer.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <SearchIcon className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>

        <Tabs value={searchType} onValueChange={setSearchType}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="shops">{t("customer.shops")}</TabsTrigger>
            <TabsTrigger value="products">{t("customer.products")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="shops">
            {shopsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredShops && filteredShops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredShops.map(shop => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <SearchIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  {search.trim() === "" ? (
                    <p className="text-center text-muted-foreground">
                      {t("customer.searchPrompt")}
                    </p>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      {t("customer.noSearchResults")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="products">
            {/* In a real app, you would have a product loading state */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map(product => (
                  <Card key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-xs text-neutral-400">{product.description}</p>
                        </div>
                        <div className="text-sm font-medium text-primary">
                          ₹{product.sellingPrice}
                          {product.mrp > product.sellingPrice && (
                            <span className="text-xs text-neutral-400 line-through ml-1">
                              ₹{product.mrp}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-neutral-400">
                          {product.unit && `Per ${product.unit}`}
                        </span>
                        <button className="bg-primary text-white text-xs px-2 py-1 rounded">
                          {t("customer.visitShop")}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <SearchIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  {search.trim() === "" ? (
                    <p className="text-center text-muted-foreground">
                      {t("customer.searchPrompt")}
                    </p>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      {t("customer.noSearchResults")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  );
}