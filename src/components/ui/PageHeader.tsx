
import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "info" | "warning";
  };
}

export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  className,
  badge,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "w-full bg-gradient-to-r from-blue-50 to-white px-4 py-6 sm:px-6 rounded-lg shadow-sm mb-6 border border-gray-50",
        className
      )}
      role="region"
      aria-labelledby="section-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="inline-flex items-center justify-center bg-white rounded-lg p-2.5 shadow-sm border border-gray-50">
              {icon}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1
                id="section-heading"
                className="font-semibold text-xl sm:text-2xl tracking-tight text-gray-900"
              >
                {title}
              </h1>
              {badge && (
                <Badge variant={badge.variant || "info"} className="ml-2">
                  {badge.text}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-shrink-0 gap-2">{actions}</div>}
      </div>
    </section>
  );
}
