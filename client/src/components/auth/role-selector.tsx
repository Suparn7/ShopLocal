import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { UserRole } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface RoleSelectorProps {
  control: Control<any>;
}

export function RoleSelector({ control }: RoleSelectorProps) {
  const { t } = useTranslation();
  
  return (
    <FormField
      control={control}
      name="role"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("auth.roleLabel")}</FormLabel>
          <div className="grid grid-cols-3 gap-2">
            <RoleButton 
              role={UserRole.CUSTOMER} 
              icon="user" 
              label={t("auth.roles.customer")} 
              isSelected={field.value === UserRole.CUSTOMER}
              onClick={() => field.onChange(UserRole.CUSTOMER)}
            />
            <RoleButton 
              role={UserRole.VENDOR} 
              icon="store" 
              label={t("auth.roles.vendor")} 
              isSelected={field.value === UserRole.VENDOR}
              onClick={() => field.onChange(UserRole.VENDOR)}
            />
            {/* Admin role is hidden in normal operation, only for demo */}
            <RoleButton 
              role={UserRole.ADMIN} 
              icon="shield" 
              label={t("auth.roles.admin")} 
              isSelected={field.value === UserRole.ADMIN}
              onClick={() => field.onChange(UserRole.ADMIN)}
            />
          </div>
          <FormControl>
            <input type="hidden" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

interface RoleButtonProps {
  role: string;
  icon: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function RoleButton({ role, icon, label, isSelected, onClick }: RoleButtonProps) {
  return (
    <button
      type="button"
      className={`
        flex flex-col items-center justify-center p-2 rounded-lg border
        ${isSelected
          ? "bg-primary/10 border-primary text-primary"
          : "bg-white border-neutral-200 text-secondary hover:bg-neutral-50"
        }
      `}
      onClick={onClick}
    >
      <i className={`fas fa-${icon} mb-1`}></i>
      <div className="text-xs font-medium">{label}</div>
    </button>
  );
}
