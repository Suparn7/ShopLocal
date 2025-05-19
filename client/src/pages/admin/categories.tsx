import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryCard } from "@/components/admin/category-card";
import { Plus, Loader2 } from "lucide-react";
import { Category, insertCategorySchema } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extend category schema with validation rules
const categoryFormSchema = insertCategorySchema.extend({
  name: z.string().min(2, { message: "Category name must be at least 2 characters" }),
  nameHi: z.string().min(2, { message: "Hindi name must be at least 2 characters" }),
  icon: z.string().min(1, { message: "Icon is required" }),
  color: z.string().min(1, { message: "Color is required" }),
});

export default function AdminCategories() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: selectedCategory?.name || "",
      nameHi: selectedCategory?.nameHi || "",
      icon: selectedCategory?.icon || "",
      color: selectedCategory?.color || "#FF5722",
    },
  });
  
  // Update form when selected category changes
  useEffect(() => {
    if (selectedCategory) {
      form.reset({
        name: selectedCategory.name,
        nameHi: selectedCategory.nameHi,
        icon: selectedCategory.icon,
        color: selectedCategory.color,
      });
    } else {
      form.reset({
        name: "",
        nameHi: "",
        icon: "",
        color: "#FF5722",
      });
    }
  }, [selectedCategory, form]);
  
  const createCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof categoryFormSchema>) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.categoryCreated"),
        description: t("admin.categoryCreateSuccess"),
      });
      setAddCategoryOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.createFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: number, categoryData: z.infer<typeof categoryFormSchema> }) => {
      const res = await apiRequest("PUT", `/api/categories/${data.id}`, data.categoryData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.categoryUpdated"),
        description: t("admin.categoryUpdateSuccess"),
      });
      setAddCategoryOpen(false);
      setSelectedCategory(null);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.updateFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t("admin.categoryDeleted"),
        description: t("admin.categoryDeleteSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.deleteFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = async (data: z.infer<typeof categoryFormSchema>) => {
    if (selectedCategory) {
      await updateCategoryMutation.mutateAsync({ id: selectedCategory.id, categoryData: data });
    } else {
      await createCategoryMutation.mutateAsync(data);
    }
  };
  
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setAddCategoryOpen(true);
  };
  
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setAddCategoryOpen(true);
  };
  
  const handleDeleteCategory = async (categoryId: number) => {
    if (confirm(t("admin.confirmDeleteCategory"))) {
      await deleteCategoryMutation.mutateAsync(categoryId);
    }
  };
  
  // Common icon options
  const iconOptions = [
    "shopping-basket", "prescription-bottle-alt", "gem", "carrot", 
    "tshirt", "book", "utensils", "home", "mobile-alt", "laptop",
    "shoe-prints", "glasses", "paint-brush", "tools", "gift"
  ];
  
  // Color options
  const colorOptions = [
    "#FF5722", "#2196F3", "#FFC107", "#4CAF50", "#9C27B0",
    "#F44336", "#3F51B5", "#8BC34A", "#FFEB3B", "#009688",
    "#E91E63", "#673AB7", "#CDDC39", "#00BCD4", "#FF9800"
  ];
  
  useEffect(() => {
    document.title = "Category Management - ShopLocal";
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">{t("admin.categoryManagement")}</h3>
              <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
                <DialogTrigger asChild>
                  <Button className="text-white" onClick={handleAddCategory}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("admin.addCategory")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedCategory ? t("admin.editCategory") : t("admin.addCategory")}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("admin.categoryName")} (English)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t("admin.enterCategoryName")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="nameHi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("admin.categoryName")} (हिंदी)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t("admin.enterHindiName")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("admin.icon")}</FormLabel>
                            <div className="grid grid-cols-5 gap-2 mb-2">
                              {iconOptions.map(icon => (
                                <div 
                                  key={icon}
                                  className={`
                                    flex items-center justify-center p-2 rounded border cursor-pointer text-center
                                    ${field.value === icon ? 'border-primary bg-primary/10' : 'border-neutral-200 hover:bg-neutral-50'}
                                  `}
                                  onClick={() => field.onChange(icon)}
                                >
                                  <i className={`fas fa-${icon}`}></i>
                                </div>
                              ))}
                            </div>
                            <FormControl>
                              <Input {...field} placeholder={t("admin.enterIconName")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("admin.color")}</FormLabel>
                            <div className="grid grid-cols-5 gap-2 mb-2">
                              {colorOptions.map(color => (
                                <div 
                                  key={color}
                                  className={`
                                    w-full h-8 rounded border cursor-pointer
                                    ${field.value === color ? 'ring-2 ring-offset-2 ring-primary' : 'border-neutral-200'}
                                  `}
                                  style={{ backgroundColor: color }}
                                  onClick={() => field.onChange(color)}
                                ></div>
                              ))}
                            </div>
                            <FormControl>
                              <Input {...field} type="color" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setAddCategoryOpen(false)}
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                        >
                          {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {selectedCategory ? t("common.save") : t("common.add")}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !categories || categories.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-neutral-400 mb-4">
                  <i className="fas fa-th-large text-5xl opacity-30"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">{t("admin.noCategories")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("admin.addCategoriesDescription")}</p>
                <Button onClick={handleAddCategory}>
                  {t("admin.addFirstCategory")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map(category => (
                  <CategoryCard 
                    key={category.id} 
                    category={category} 
                    onEdit={() => handleEditCategory(category)}
                    onDelete={() => handleDeleteCategory(category.id)}
                    shopCount={Math.floor(Math.random() * 50)} // Would come from API in real app
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
