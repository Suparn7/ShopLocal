import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/layout";
import { Card, CardContent } from "@/components/ui/card";
import { VendorApprovalItem } from "@/components/admin/vendor-approval-item";
import { Loader2 } from "lucide-react";
import { Shop, User } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Fetch all shops (including unapproved ones)
  const { data: shops, isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/admin/shops"],
    enabled: !!user,
  });
  
  // Fetch vendors
  const { data: vendors, isLoading: vendorsLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/vendors"],
    enabled: !!user,
  });
  
  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/customers"],
    enabled: !!user,
  });
  
  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/orders"],
    enabled: !!user,
  });
  
  const isLoading = shopsLoading || vendorsLoading || customersLoading || ordersLoading;
  
  // Get pending shops for approval
  const pendingShops = shops?.filter(shop => !shop.isApproved) || [];
  
  // Calculate statistics
  const totalVendors = vendors?.length || 0;
  const totalCustomers = customers?.length || 0;
  
  // Calculate today's orders and revenue
  const getTodayOrders = () => {
    if (!orders) return [];
    const today = new Date().toISOString().split('T')[0];
    return orders.filter(order => 
      new Date(order.createdAt).toISOString().split('T')[0] === today
    );
  };
  
  const todayOrders = getTodayOrders();
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  // Calculate month growth
  const getThisMonthGrowth = (count: number, type: 'vendors' | 'customers') => {
    // In a real app, this would calculate actual growth from the database
    // For demo purposes, we'll return hardcoded values
    return type === 'vendors' ? 12 : 23;
  };
  
  const vendorGrowth = getThisMonthGrowth(totalVendors, 'vendors');
  const customerGrowth = getThisMonthGrowth(totalCustomers, 'customers');
  
  useEffect(() => {
    document.title = "Admin Dashboard - ShopLocal";
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-neutral-400 text-sm">{t("admin.totalVendors")}</p>
                  <p className="text-2xl font-bold">{totalVendors}</p>
                  <p className="text-success text-xs mt-1">
                    <i className="fas fa-arrow-up"></i> {vendorGrowth}% {t("admin.thisMonth")}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <p className="text-neutral-400 text-sm">{t("admin.totalCustomers")}</p>
                  <p className="text-2xl font-bold">{totalCustomers}</p>
                  <p className="text-success text-xs mt-1">
                    <i className="fas fa-arrow-up"></i> {customerGrowth}% {t("admin.thisMonth")}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <p className="text-neutral-400 text-sm">{t("admin.ordersToday")}</p>
                  <p className="text-2xl font-bold">{todayOrders.length}</p>
                  <p className="text-success text-xs mt-1">
                    <i className="fas fa-arrow-up"></i> 8% {t("vendor.fromYesterday")}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <p className="text-neutral-400 text-sm">{t("admin.revenueToday")}</p>
                  <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
                  <p className="text-success text-xs mt-1">
                    <i className="fas fa-arrow-up"></i> 15% {t("vendor.fromYesterday")}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Pending Vendor Approvals */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">
                    {t("admin.pendingApprovals")} ({pendingShops.length})
                  </h3>
                  <button 
                    onClick={() => window.location.href = "/admin/vendors"} 
                    className="text-primary text-sm"
                  >
                    {t("common.seeAll")}
                  </button>
                </div>
                
                {pendingShops.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("admin.noApprovals")}
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
                        {pendingShops.slice(0, 5).map(shop => (
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
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
