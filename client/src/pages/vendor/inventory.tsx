import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import VendorLayout from "@/components/vendor/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddProductForm } from "@/components/vendor/add-product-form";
import { Loader2, Search, Filter, Plus } from "lucide-react";
import { Product, Shop } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function VendorInventory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  // Fetch vendor shops
  const { data: shops, isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/vendor/shops"],
    enabled: !!user,
  });
  
  // Get the first shop for simplicity (for demo purposes)
  const shop = shops && shops.length > 0 ? shops[0] : null;
  
  // Fetch products for the shop
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [`/api/shops/${shop?.id}/products`],
    enabled: !!shop,
  });
  
  const isLoading = shopsLoading || productsLoading;
  
  // Filter products based on search term
  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Delete product
  const deleteProduct = async (productId: number) => {
    if (!confirm(t("vendor.confirmDelete"))) return;
    
    try {
      await apiRequest("DELETE", `/api/products/${productId}`, undefined);
      
      toast({
        title: t("vendor.productDeleted"),
        description: t("vendor.productDeleteSuccess"),
      });
      
      // Refresh products list
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${shop?.id}/products`] });
    } catch (error) {
      toast({
        title: t("vendor.deleteFailed"),
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  // Toggle product availability
  const toggleProductAvailability = async (productId: number, currentAvailability: boolean) => {
    try {
      await apiRequest("PUT", `/api/products/${productId}`, { 
        isAvailable: !currentAvailability 
      });
      
      toast({
        title: currentAvailability ? t("vendor.productHidden") : t("vendor.productVisible"),
        description: currentAvailability ? 
          t("vendor.productHiddenMessage") : 
          t("vendor.productVisibleMessage"),
      });
      
      // Refresh products list
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${shop?.id}/products`] });
    } catch (error) {
      toast({
        title: t("vendor.updateFailed"),
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  // Handle product edit
  const handleEditProduct = (productId: number) => {
    setSelectedProductId(productId);
    setAddProductOpen(true);
  };
  
  useEffect(() => {
    document.title = "Inventory Management - ShopLocal";
  }, []);

  return (
    <VendorLayout>
      <div className="max-w-5xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold">{t("vendor.inventory")}</h2>
              
              <div className="flex w-full sm:w-auto space-x-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("vendor.searchProducts")}
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                
                <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("vendor.addProduct")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedProductId ? t("vendor.editProduct") : t("vendor.addProduct")}
                      </DialogTitle>
                    </DialogHeader>
                    {shop ? (
                      <AddProductForm 
                        shopId={shop.id}
                        productId={selectedProductId}
                        onSuccess={() => {
                          setAddProductOpen(false);
                          setSelectedProductId(null);
                        }}
                      />
                    ) : (
                      <div className="text-center py-4">
                        <p>{t("vendor.noShopsAvailable")}</p>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {!shop ? (
              <div className="text-center py-8">
                <div className="text-neutral-400 mb-4">
                  <i className="fas fa-store text-5xl opacity-30"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">{t("vendor.noShops")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("vendor.createShopFirst")}</p>
                <Button onClick={() => window.location.href = "/vendor/settings"}>
                  {t("vendor.createShop")}
                </Button>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !filteredProducts || filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                {searchTerm ? (
                  <>
                    <div className="text-neutral-400 mb-4">
                      <i className="fas fa-search text-5xl opacity-30"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t("vendor.noProductsFound")}</h3>
                    <p className="text-sm text-muted-foreground">{t("vendor.tryDifferentSearch")}</p>
                  </>
                ) : (
                  <>
                    <div className="text-neutral-400 mb-4">
                      <i className="fas fa-box text-5xl opacity-30"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t("vendor.noProducts")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t("vendor.addProductsToInventory")}</p>
                    <Button onClick={() => setAddProductOpen(true)}>
                      {t("vendor.addFirstProduct")}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("vendor.product")}</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("vendor.price")}</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("vendor.stock")}</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("vendor.status")}</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("vendor.action")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-neutral-50">
                        <td className="px-3 py-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-neutral-100 mr-3 flex items-center justify-center">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <i className="fas fa-box text-neutral-300"></i>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.description && (
                                <div className="text-xs text-muted-foreground">{product.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium">{formatCurrency(product.sellingPrice)}</div>
                          {product.mrp > product.sellingPrice && (
                            <div className="text-xs text-muted-foreground line-through">
                              {formatCurrency(product.mrp)}
                            </div>
                          )}
                        </td>
                        <td className="px-q3 py-3">
                          <div className={product.stock <= 5 ? "text-amber-600" : "text-success"}>
                            {product.stock}
                          </div>
                          {product.unit && (
                            <div className="text-xs text-muted-foreground">{product.unit}</div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={product.isAvailable ? "default" : "outline"}>
                            {product.isAvailable ? t("vendor.available") : t("vendor.hidden")}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <i className="fas fa-ellipsis-v"></i>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t("vendor.actions")}</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                                <i className="fas fa-pen mr-2"></i> {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleProductAvailability(product.id, product.isAvailable)}>
                                <i className={`fas fa-${product.isAvailable ? 'eye-slash' : 'eye'} mr-2`}></i> 
                                {product.isAvailable ? t("vendor.hide") : t("vendor.show")}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => deleteProduct(product.id)}
                              >
                                <i className="fas fa-trash mr-2"></i> {t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
