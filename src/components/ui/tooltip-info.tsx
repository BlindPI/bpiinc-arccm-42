import React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipInfoProps {
  content: React.ReactNode;
  className?: string;
}

export function TooltipInfo({ content, className = "" }: TooltipInfoProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className={`h-4 w-4 text-muted-foreground hover:text-primary cursor-help ${className}`} />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-900 dark:text-gray-100">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}