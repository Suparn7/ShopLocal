import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import CustomerLayout from "@/components/customer/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CustomerProfile as CustomerProfileType, insertCustomerProfileSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

// Extend profile schema with validation rules
const profileSchema = insertCustomerProfileSchema.extend({
  address: z.string().min(1, { message: "Address is required" }),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  postalCode: z.string().min(6, { message: "Valid postal code is required" }).max(6),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export default function CustomerProfilePage() {
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Fetch customer profile
  const { data: profile, isLoading: profileLoading } = useQuery<CustomerProfileType>({
    queryKey: ["/api/customer/profile"],
    enabled: !!user,
  });
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      address: profile?.address || "",
      city: profile?.city || "",
      state: profile?.state || "",
      postalCode: profile?.postalCode || "",
    },
  });
  
  // Update form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        postalCode: profile.postalCode || "",
        latitude: profile.latitude || undefined,
        longitude: profile.longitude || undefined,
      });
    }
  }, [profile, form]);
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PUT", "/api/customer/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("customer.profileUpdated"),
        description: t("customer.profileUpdateSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("customer.updateFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    await updateProfileMutation.mutateAsync(data);
  };
  
  const getUserLocation = async () => {
    try {
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          form.setValue("latitude", position.coords.latitude);
          form.setValue("longitude", position.coords.longitude);
          
          toast({
            title: t("customer.locationUpdated"),
            description: t("customer.locationUpdateSuccess"),
          });
        });
      } else {
        toast({
          title: t("customer.locationError"),
          description: t("customer.geolocationNotSupported"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("customer.locationError"),
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  useEffect(() => {
    document.title = `${t("common.profile")} - ShopLocal`;
  }, [t]);

  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-4 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="profile">{t("customer.profileInfo")}</TabsTrigger>
            <TabsTrigger value="account">{t("customer.accountSettings")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t("customer.profileInfo")}</CardTitle>
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="flex flex-col items-center mb-6">
                        <Avatar className="h-20 w-20 mb-2">
                          <AvatarFallback className="bg-primary text-white text-xl">
                            {getInitials(user?.name || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-lg font-medium">{user?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user?.phone || user?.email}
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("customer.address")}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t("customer.enterAddress")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("customer.city")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t("customer.enterCity")} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("customer.state")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t("customer.enterState")} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("customer.postalCode")}</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder={t("customer.enterPostalCode")}
                                maxLength={6}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full mb-2"
                          onClick={getUserLocation}
                        >
                          <i className="fas fa-map-marker-alt mr-2"></i>
                          {t("customer.useCurrentLocation")}
                        </Button>
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {t("common.save")}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>{t("customer.accountSettings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{t("customer.accountInfo")}</h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">{t("customer.name")}</div>
                    <div>{user?.name}</div>
                    
                    <div className="text-muted-foreground">{t("customer.phone")}</div>
                    <div>{user?.phone || "-"}</div>
                    
                    <div className="text-muted-foreground">{t("customer.email")}</div>
                    <div>{user?.email || "-"}</div>
                    
                    <div className="text-muted-foreground">{t("customer.language")}</div>
                    <div>{user?.language === "en" ? "English" : "हिंदी"}</div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-2">{t("customer.accountActions")}</h3>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("customer.logout")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  );
}
