import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Product, insertProductSchema } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddProductFormProps {
  shopId: number;
  productId?: number | null;
  onSuccess?: () => void;
}

// Extend product schema with validation rules
const productFormSchema = insertProductSchema.extend({
  name: z.string().min(3, { message: "Product name must be at least 3 characters" }),
  description: z.string().optional(),
  mrp: z.coerce.number().positive({ message: "MRP must be a positive number" }),
  sellingPrice: z.coerce.number().positive({ message: "Selling price must be a positive number" }),
  stock: z.coerce.number().nonnegative({ message: "Stock must be a non-negative number" }),
  unit: z.string().optional().default("none"), // Use "none" as the default value
  image: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

export function AddProductForm({ shopId, productId, onSuccess }: AddProductFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file);
    console.log("Uploading file:", file);
    console.log("Form data:", formData);
    
    console.log("Uploading file:", file);
    for (const [key, value] of formData.entries()) {
      console.log(`HIIIIIIIIII${key}:`, value); // Log FormData content
    }
  
    try {
      const response = await fetch(`/api/shops/${shopId}/products/upload`, {
        method: "POST",
        body: formData, // Let the browser set the Content-Type
      });
      console.log("Upload response:", response);
      
  
      if (response.ok) {
        toast({
          title: "Upload Successful",
          description: "Products have been uploaded successfully.",
        });
        if (onSuccess) onSuccess();
      } else {
        const error = await response.json();
        toast({
          title: "Upload Failed",
          description: error.message || "An error occurred during the upload.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Fetch product details if editing
  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });
  
  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      shopId,
      name: "",
      description: "",
      mrp: 0,
      sellingPrice: 0,
      stock: 0,
      unit: "none", // Use "none" as the default value
      image: "",
      isAvailable: true,
    },
  });

  
  // Update form values when product data is loaded
  useEffect(() => {
    if (product) {
      form.reset({
        shopId,
        name: product.name,
        description: product.description || "",
        mrp: product.mrp,
        sellingPrice: product.sellingPrice,
        stock: product.stock,
        unit: product.unit || "",
        image: product.image || "",
        isAvailable: product.isAvailable,
      });
    }
  }, [product, form, shopId]);
  
  const createProductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productFormSchema>) => {
      const res = await apiRequest("POST", `/api/shops/${shopId}/products`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("vendor.productAdded"),
        description: t("vendor.productAddSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${shopId}/products`] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: t("vendor.addFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateProductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof productFormSchema>) => {
      const res = await apiRequest("PUT", `/api/products/${productId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("vendor.productUpdated"),
        description: t("vendor.productUpdateSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/shops/${shopId}/products`] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: t("vendor.updateFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  useEffect(() => {
    console.log("Current unit value:", form.getValues("unit")); // Log the current unit value
  }, [form]);
  
  const onSubmit = async (data: z.infer<typeof productFormSchema>) => {
    console.log("Form data:", data); // Log the form data
    if (productId) {
      await updateProductMutation.mutateAsync(data);
    } else {
      await createProductMutation.mutateAsync(data);
    }
  };
  
  // Common unit options
  const unitOptions = [
    { value: "none", label: t("vendor.none") }, // Replace empty string with "none"
    { value: "pcs", label: t("vendor.pcs") },
    { value: "kg", label: t("vendor.kg") },
    { value: "g", label: t("vendor.g") },
    { value: "L", label: t("vendor.L") },
    { value: "ml", label: t("vendor.ml") },
    { value: "box", label: t("vendor.box") },
    { value: "pkt", label: t("vendor.pkt") },
  ];
  
  if (productLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <div className="-mt-2">
        <Button onClick={() => window.location.href = "/api/products/template"}>
          Download Product Template
        </Button>
        <div>
          <label className="block text-sm font-medium m-1 text-gray-700">
            Upload Filled Template
          </label>
          <Input className="m-1" type="file" accept=".xlsx" onChange={handleFileChange} />
        </div>
        <Button onClick={handleUpload} disabled={!file}>
          Upload File
        </Button>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} 
    className="space-y-4 max-h-96 overflow-y-auto scrollbar-hidden"
    >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("vendor.productName")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("vendor.enterProductName")} />
              </FormControl>
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
                  rows={2} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mrp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vendor.mrp")} (₹)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vendor.sellingPrice")} (₹)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vendor.stockQuantity")}</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" placeholder="0" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vendor.unit")}</FormLabel>
                <Select value={field.value || "none"} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("vendor.selectUnit")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {unitOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("vendor.imageUrl")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("vendor.enterImageUrl")} />
              </FormControl>
              <FormDescription>
                {t("vendor.imageDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isAvailable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>{t("vendor.availability")}</FormLabel>
                <FormDescription>
                  {t("vendor.availabilityDescription")}
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
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={createProductMutation.isPending || updateProductMutation.isPending}
        >
          {(createProductMutation.isPending || updateProductMutation.isPending) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {productId ? t("vendor.updateProduct") : t("vendor.addProduct")}
        </Button>
      </form>
    </Form>
  );
}
