import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VendorApprovalItem } from "@/components/admin/vendor-approval-item";
import { Loader2, Search, Filter } from "lucide-react";
import { Shop, User } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function AdminVendors() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved">("all");
  
  // Fetch all shops
  const { data: shops, isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/admin/shops"],
    enabled: !!user,
  });
  
  // Fetch vendors
  const { data: vendors, isLoading: vendorsLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/vendors"],
    enabled: !!user,
  });
  
  const isLoading = shopsLoading || vendorsLoading;
  
  // Filter shops based on tab and search
  const filteredShops = shops?.filter(shop => {
    // Filter by approval status
    if (activeTab === "pending" && shop.isApproved) return false;
    if (activeTab === "approved" && !shop.isApproved) return false;
    
    // Filter by search term
    if (searchTerm) {
      const vendor = vendors?.find(v => v.id === shop.vendorId);
      const vendorName = vendor?.name || "";
      
      return (
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return true;
  });
  
  useEffect(() => {
    document.title = "Vendor Management - ShopLocal";
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold">{t("admin.vendorManagement")}</h2>
              
              <div className="flex w-full sm:w-auto space-x-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("admin.searchVendors")}
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Tabs 
              defaultValue="all" 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as "all" | "pending" | "approved")}
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="all">{t("admin.allVendors")}</TabsTrigger>
                <TabsTrigger value="pending">{t("admin.pendingVendors")}</TabsTrigger>
                <TabsTrigger value="approved">{t("admin.approvedVendors")}</TabsTrigger>
              </TabsList>
              
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !filteredShops || filteredShops.length === 0 ? (
                <div className="text-center py-8">
                  {searchTerm ? (
                    <>
                      <div className="text-neutral-400 mb-4">
                        <i className="fas fa-search text-5xl opacity-30"></i>
                      </div>
                      <h3 className="text-lg font-medium mb-2">{t("admin.noVendorsFound")}</h3>
                      <p className="text-sm text-muted-foreground">{t("admin.tryDifferentSearch")}</p>
                    </>
                  ) : (
                    <>
                      <div className="text-neutral-400 mb-4">
                        <i className="fas fa-store text-5xl opacity-30"></i>
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        {activeTab === "all" 
                          ? t("admin.noVendors") 
                          : activeTab === "pending" 
                            ? t("admin.noPendingVendors") 
                            : t("admin.noApprovedVendors")}
                      </h3>
                    </>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("admin.vendor")}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("common.categories")}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("admin.location")}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("admin.gstStatus")}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("vendor.action")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredShops.map(shop => (
                        <VendorApprovalItem 
                          key={shop.id} 
                          shop={shop} 
                          vendors={vendors || []}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
