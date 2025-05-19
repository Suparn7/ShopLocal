import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter, User as UserIcon } from "lucide-react";
import { User, Order } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { getInitials, formatCurrency } from "@/lib/utils";

export default function AdminCustomers() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);
  
  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/customers"],
    enabled: !!user,
  });
  
  // Fetch customer orders
  const { data: customerOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: [`/api/admin/customers/${selectedCustomerId}/orders`],
    enabled: !!selectedCustomerId,
  });
  
  const isLoading = customersLoading;
  
  // Filter customers based on search
  const filteredCustomers = customers?.filter(customer => {
    if (!searchTerm) return true;
  
    return (
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
  });
  
  const handleViewCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setCustomerDetailsOpen(true);
  };
  
  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);
  
  useEffect(() => {
    document.title = "Customer Management - ShopLocal";
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold">{t("admin.customerManagement")}</h2>
              
              <div className="flex w-full sm:w-auto space-x-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("admin.searchCustomers")}
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
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !filteredCustomers || filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                {searchTerm ? (
                  <>
                    <div className="text-neutral-400 mb-4">
                      <i className="fas fa-search text-5xl opacity-30"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t("admin.noCustomersFound")}</h3>
                    <p className="text-sm text-muted-foreground">{t("admin.tryDifferentSearch")}</p>
                  </>
                ) : (
                  <>
                    <div className="text-neutral-400 mb-4">
                      <UserIcon className="mx-auto h-16 w-16 opacity-30" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t("admin.noCustomers")}</h3>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("admin.customer")}</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("admin.contactInfo")}</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("admin.joinedOn")}</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("vendor.action")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredCustomers.map(customer => (
                      <tr key={customer.id} className="hover:bg-neutral-50">
                        <td className="px-3 py-3">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback className="bg-primary text-white">
                                {getInitials(customer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-xs text-muted-foreground">ID: {customer.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm">
                            {customer.phone && (
                              <div className="flex items-center">
                                <i className="fas fa-phone text-xs mr-2 text-muted-foreground"></i>
                                {customer.phone}
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center mt-1">
                                <i className="fas fa-envelope text-xs mr-2 text-muted-foreground"></i>
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-primary"
                            onClick={() => handleViewCustomer(customer.id)}
                          >
                            {t("admin.viewDetails")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Customer Details Dialog */}
        <Dialog open={customerDetailsOpen} onOpenChange={setCustomerDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("admin.customerDetails")}</DialogTitle>
            </DialogHeader>

            {selectedCustomer && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-white text-xl">
                      {getInitials(selectedCustomer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xl font-medium">{selectedCustomer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {t("admin.memberSince")} {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">{t("admin.orderHistory")}</h4>
                  {ordersLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : !customerOrders || customerOrders.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">
                      {t("admin.noOrders")}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customerOrders.map(order => (
                        <div key={order.id} className="flex justify-between items-center text-sm">
                          <div>
                            <div>#{order.id}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
