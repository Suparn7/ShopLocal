import { useCallback } from "react";
import { useLocation } from "wouter";
import { Category } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface CategoryCardProps {
  category: Category;
  onClick?: () => void; // Optional custom onClick handler
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [, navigate] = useLocation();
  
  // Display name based on current language
  const displayName = currentLanguage === 'hi' ? category.nameHi : category.name;
  
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(); // Use custom onClick if provided
    } else {
      navigate(`/customer?categoryId=${category.id}`); // Default navigation
    }
  }, [category.id, navigate, onClick]);
  
  
  return (
    <div 
      className="flex flex-col items-center cursor-pointer" 
      onClick={handleClick}
    >
      <div 
        className="w-14 h-14 rounded-full flex items-center justify-center mb-1"
        style={{ 
          backgroundColor: `${category.color}10`,
          color: category.color
        }}
      >
        <i className={`fas fa-${category.icon}`}></i>
      </div>
      <span className="text-xs text-center">{displayName}</span>
    </div>
  );
}
