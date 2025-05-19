import { Category } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface CategoryCardProps {
  category: Category;
  shopCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function CategoryCard({ category, shopCount, onEdit, onDelete }: CategoryCardProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  
  // Display name based on current language
  const displayName = currentLanguage === 'hi' ? category.nameHi : category.name;
  
  return (
    <div className="border border-neutral-200 rounded-lg p-3 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: `${category.color}10`,
            color: category.color
          }}
        >
          <i className={`fas fa-${category.icon}`}></i>
        </div>
        <div className="flex">
          <Button variant="ghost" size="icon" className="text-neutral-400 text-sm" onClick={onEdit}>
            <i className="fas fa-pen"></i>
          </Button>
          <Button variant="ghost" size="icon" className="text-neutral-400 text-sm" onClick={onDelete}>
            <i className="fas fa-trash"></i>
          </Button>
        </div>
      </div>
      <h4 className="font-medium">{displayName}</h4>
      <p className="text-xs text-neutral-400">{shopCount} {t("admin.vendors")}</p>
    </div>
  );
}
