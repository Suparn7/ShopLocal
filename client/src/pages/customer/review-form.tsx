import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ReviewForm() {
  const { shopId } = useParams();
  const [location] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract orderId from query parameters
  const queryParams = new URLSearchParams(location.split("?")[1]);
  const orderId = queryParams.get("orderId");

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        title: t("customer.ratingRequired"),
        description: t("customer.pleaseProvideRating"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("POST", `/api/shops/${shopId}/reviews`, {
        rating,
        comment,
        orderId: parseInt(orderId || "0"),
      });

      toast({
        title: t("customer.reviewSubmitted"),
        description: t("customer.thankYouForReview"),
      });

      // Redirect to shop details page
      window.location.href = `/customer/shop/${shopId}`;
    } catch (error) {
      toast({
        title: t("customer.reviewFailed"),
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">{t("customer.writeReview")}</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("customer.rating")}</label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`text-2xl ${star <= rating ? "text-amber-400" : "text-neutral-300"}`}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("customer.comment")}</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("customer.writeComment")}
          />
        </div>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? t("customer.submitting") : t("customer.submitReview")}
        </Button>
      </div>
    </div>
  );
}