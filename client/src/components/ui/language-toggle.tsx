import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const { user, setLanguageMutation } = useAuth();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    
    // If user is logged in, save preference
    if (user) {
      setLanguageMutation.mutate({ language: newLang });
    }
  };
  
  return (
    <div className="flex">
      <Button
        onClick={toggleLanguage}
        variant={i18n.language === 'en' ? "default" : "outline"}
        size="sm"
        className={`mr-2 px-2 py-1 text-xs ${i18n.language === 'en' ? 'bg-primary text-white' : 'border'}`}
      >
        English
      </Button>
      <Button
        onClick={toggleLanguage}
        variant={i18n.language === 'hi' ? "default" : "outline"}
        size="sm"
        className={`px-2 py-1 text-xs ${i18n.language === 'hi' ? 'bg-primary text-white' : 'border'}`}
      >
        हिंदी
      </Button>
    </div>
  );
}
