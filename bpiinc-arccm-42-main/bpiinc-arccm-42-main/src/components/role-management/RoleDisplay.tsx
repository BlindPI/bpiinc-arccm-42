
import { UserRole } from "@/types/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { Shield, ShieldAlert, ShieldCheck, Award, BookOpen, GraduationCap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RoleDisplayProps {
  role: UserRole;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'SA':
      return ShieldAlert;
    case 'AD':
      return Shield;
    case 'AP':
      return ShieldCheck;
    case 'IC':
      return Award;
    case 'IP':
      return GraduationCap;
    case 'IT':
      return BookOpen;
    default:
      return BookOpen;
  }
};

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case 'SA':
      return "text-red-500";
    case 'AD':
      return "text-purple-500";
    case 'AP':
      return "text-blue-500";
    case 'IC':
      return "text-green-500";
    case 'IP':
      return "text-amber-500";
    case 'IT':
      return "text-gray-500";
    default:
      return "text-gray-500";
  }
};

const getRoleBgColor = (role: UserRole) => {
  switch (role) {
    case 'SA':
      return "bg-red-50";
    case 'AD':
      return "bg-purple-50";
    case 'AP':
      return "bg-blue-50";
    case 'IC':
      return "bg-green-50";
    case 'IP':
      return "bg-amber-50";
    case 'IT':
      return "bg-gray-50";
    default:
      return "bg-gray-50";
  }
};

export function RoleDisplay({ role, showLabel = true, size = 'md', showTooltip = true }: RoleDisplayProps) {
  const Icon = getRoleIcon(role);
  const colorClass = getRoleColor(role);
  const bgColorClass = getRoleBgColor(role);
  
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size];
  
  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];
  
  const paddingSize = {
    sm: 'px-1.5 py-0.5',
    md: 'px-2 py-1',
    lg: 'px-3 py-1.5'
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-1 rounded-full ${paddingSize} ${bgColorClass} ${colorClass} font-medium`}>
      <Icon className={iconSize} />
      {showLabel && <span className={textSize}>{ROLE_LABELS[role]}</span>}
    </div>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <p>{ROLE_LABELS[role]}</p>
            <p className="text-xs text-muted-foreground mt-1">Role: {role}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
