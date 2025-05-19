import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface FestivalBannerProps {
  title: string;
  description: string;
  buttonText: string;
  festival: 'diwali' | 'holi' | 'generic';
}

export function FestivalBanner({ title, description, buttonText, festival }: FestivalBannerProps) {
  const { t } = useTranslation();
  
  // Define background gradients for different festivals
  const getBannerStyles = () => {
    switch (festival) {
      case 'diwali':
        return "bg-gradient-to-r from-[#FFA000] to-[#FF6D00]";
      case 'holi':
        return "bg-gradient-to-r from-[#8E24AA] to-[#D81B60]";
      default:
        return "bg-gradient-to-r from-primary to-accent";
    }
  };
  
  // Get appropriate festival icon
  const getFestivalIcon = () => {
    switch (festival) {
      case 'diwali':
        return "fas fa-diya";
      case 'holi':
        return "fas fa-palette";
      default:
        return "fas fa-gift";
    }
  };
  
  return (
    <div className={`${getBannerStyles()} rounded-lg mb-6 p-4 text-white shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1">{title}</h3>
          <p className="text-sm mb-2">{description}</p>
          <Button variant="secondary" size="sm" className="bg-white text-primary hover:bg-white/90">
            {buttonText}
          </Button>
        </div>
        <div className="h-20 w-20 rounded-lg bg-white/10 flex items-center justify-center">
          <i className={`${getFestivalIcon()} text-4xl`}></i>
        </div>
      </div>
    </div>
  );
}
