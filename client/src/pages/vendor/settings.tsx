import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import VendorLayout from "@/components/vendor/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Category, Shop, insertShopSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { generateTimeSlots } from "@/lib/utils";

// Extend shop schema with validation rules
const shopFormSchema = insertShopSchema.extend({
  name: z.string().min(3, { message: "Shop name must be at least 3 characters" }),
  address: z.string().min(3, { message: "Address is required" }),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  postalCode: z.string().min(6, { message: "Valid postal code is required" }).max(6),
  gstin: z.string().optional(),
  description: z.string().optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  avgDeliveryTime: z.coerce.number().min(1).optional(),
  image: z.string().optional(),
});

export default function VendorSettings() {
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("shop");
  
  // Fetch vendor shops
  const { data: shops, isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/vendor/shops"],
    enabled: !!user,
  });
  
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  const isLoading = shopsLoading || categoriesLoading;
  
  // Get the first shop for editing (in a real app, would allow selecting from multiple shops)
  const shop = shops && shops.length > 0 ? shops[0] : null;
  
  // Generate time slots for shop hours
  const timeSlots = generateTimeSlots();
  
  const form = useForm<z.infer<typeof shopFormSchema>>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      name: shop?.name || "",
      categoryId: shop?.categoryId || 1,
      description: shop?.description || "",
      address: shop?.address || "",
      city: shop?.city || "",
      state: shop?.state || "",
      postalCode: shop?.postalCode || "",
      gstin: shop?.gstin || "",
      isOpen: shop?.isOpen ?? true,
      deliveryAvailable: shop?.deliveryAvailable ?? true,
      openTime: shop?.openTime || "09:00",
      closeTime: shop?.closeTime || "21:00",
      avgDeliveryTime: shop?.avgDeliveryTime || 30,
      image: shop?.image || "",
      latitude: shop?.latitude,
      longitude: shop?.longitude,
      vendorId: user?.id || 0,
    },
  });
  
  // Update form when shop data is loaded
  useEffect(() => {
    if (shop) {
      form.reset({
        name: shop.name,
        categoryId: shop.categoryId,
        description: shop.description || "",
        address: shop.address,
        city: shop.city,
        state: shop.state,
        postalCode: shop.postalCode || "",
        gstin: shop.gstin || "",
        isOpen: shop.isOpen,
        deliveryAvailable: shop.deliveryAvailable,
        openTime: shop.openTime || "09:00",
        closeTime: shop.closeTime || "21:00",
        avgDeliveryTime: shop.avgDeliveryTime || 30,
        image: shop.image || "",
        latitude: shop.latitude,
        longitude: shop.longitude,
        vendorId: user?.id || 0,
      });
    }
  }, [shop, form, user]);
  
  const createShopMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shopFormSchema>) => {
      console.log("Creating shop with data:", data);
      
      const res = await apiRequest("POST", "/api/shops", data);
      console.log("Create shop response:", res);
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("vendor.shopCreated"),
        description: t("vendor.shopCreateSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/shops"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("vendor.createFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateShopMutation = useMutation({
    mutationFn: async (data: { id: number, shopData: z.infer<typeof shopFormSchema> }) => {
      const res = await apiRequest("PUT", `/api/shops/${data.id}`, data.shopData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("vendor.shopUpdated"),
        description: t("vendor.shopUpdateSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/shops"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("vendor.updateFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = async (data: z.infer<typeof shopFormSchema>) => {
    try {
      // If latitude and longitude are not provided, fetch them using the address
      if (!data.latitude || !data.longitude) {
        const response = await fetch(
          `/api/geocode?address=${encodeURIComponent(`${data.address}, ${data.city}, ${data.state}, ${data.postalCode}`)}`
        );
        const geocodeData = await response.json();
  
        if (geocodeData.geocodingResults && geocodeData.geocodingResults.length > 0) {
          const firstResult = geocodeData.geocodingResults[0];
          data.latitude = firstResult.geometry.location.lat;
          data.longitude = firstResult.geometry.location.lng;
        } else {
          throw new Error("Failed to fetch latitude and longitude for the provided address.");
        }
      }
      console.log("Shop data to submit:", data);
      
  
      // Create or update the shop
      if (shop) {
        await updateShopMutation.mutateAsync({ id: shop.id, shopData: data });
      } else {
        await createShopMutation.mutateAsync(data);
      }
    } catch (error) {
      toast({
        title: t("vendor.locationError"),
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  const getShopLocation = async () => {
    try {
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          form.setValue("latitude", position.coords.latitude);
          form.setValue("longitude", position.coords.longitude);
          
          toast({
            title: t("vendor.locationUpdated"),
            description: t("vendor.locationUpdateSuccess"),
          });
        });
      } else {
        toast({
          title: t("vendor.locationError"),
          description: t("vendor.geolocationNotSupported"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("vendor.locationError"),
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  useEffect(() => {
    document.title = "Shop Settings - ShopLocal";
  }, []);

  return (
    <VendorLayout>
      <div className="max-w-5xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="shop">{t("vendor.shopSettings")}</TabsTrigger>
            <TabsTrigger value="account">{t("vendor.accountSettings")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="shop">
            <Card>
              <CardHeader>
                <CardTitle>
                  {shop ? t("vendor.editShop") : t("vendor.createShop")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">{t("vendor.basicInfo")}</h3>
                        
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("vendor.shopName")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t("vendor.enterShopName")} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("vendor.category")}</FormLabel>
                              <Select 
                                value={field.value.toString()} 
                                onValueChange={(value) => field.onChange(parseInt(value))}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("vendor.selectCategory")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories?.map(category => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("vendor.description")}</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder={t("vendor.enterDescription")}
                                  rows={3} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-medium">{t("vendor.address")}</h3>
                        
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("vendor.streetAddress")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t("vendor.enterStreetAddress")} />
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
                                <FormLabel>{t("vendor.city")}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder={t("vendor.enterCity")} />
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
                                <FormLabel>{t("vendor.state")}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder={t("vendor.enterState")} />
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
                              <FormLabel>{t("vendor.postalCode")}</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder={t("vendor.enterPostalCode")}
                                  maxLength={6}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getShopLocation}
                          className="w-full"
                        >
                          <i className="fas fa-map-marker-alt mr-2"></i>
                          {t("vendor.useCurrentLocation")}
                        </Button>
                      </div>
                      
                      <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-medium">{t("vendor.businessDetails")}</h3>
                        
                        <FormField
                          control={form.control}
                          name="gstin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("vendor.gstin")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t("vendor.enterGstin")} />
                              </FormControl>
                              <FormDescription>
                                {t("vendor.gstinDescription")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="openTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("vendor.openingTime")}</FormLabel>
                                <Select 
                                  value={field.value || ""} 
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t("vendor.selectTime")} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {timeSlots.map(slot => (
                                      <SelectItem key={slot.value} value={slot.value}>
                                        {slot.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="closeTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("vendor.closingTime")}</FormLabel>
                                <Select 
                                  value={field.value || ""} 
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t("vendor.selectTime")} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {timeSlots.map(slot => (
                                      <SelectItem key={slot.value} value={slot.value}>
                                        {slot.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="avgDeliveryTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("vendor.avgDeliveryTime")}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  placeholder={t("vendor.enterMinutes")}
                                />
                              </FormControl>
                              <FormDescription>
                                {t("vendor.deliveryTimeDescription")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-medium">{t("vendor.shopPreferences")}</h3>
                        
                        <FormField
                          control={form.control}
                          name="isOpen"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>{t("vendor.shopStatus")}</FormLabel>
                                <FormDescription>
                                  {t("vendor.shopStatusDescription")}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="deliveryAvailable"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>{t("vendor.deliveryAvailable")}</FormLabel>
                                <FormDescription>
                                  {t("vendor.deliveryDescription")}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={createShopMutation.isPending || updateShopMutation.isPending}
                      >
                        {(createShopMutation.isPending || updateShopMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {shop ? t("vendor.updateShop") : t("vendor.createShop")}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>{t("vendor.accountSettings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{t("vendor.accountInfo")}</h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">{t("vendor.name")}</div>
                    <div>{user?.name}</div>
                    
                    <div className="text-muted-foreground">{t("vendor.phone")}</div>
                    <div>{user?.phone || "-"}</div>
                    
                    <div className="text-muted-foreground">{t("vendor.email")}</div>
                    <div>{user?.email || "-"}</div>
                    
                    <div className="text-muted-foreground">{t("vendor.language")}</div>
                    <div>{user?.language === "en" ? "English" : "हिंदी"}</div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-2">{t("vendor.accountActions")}</h3>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("vendor.logout")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </VendorLayout>
  );
}
