
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
        "w-full bg-gradient-to-r from-white via-gray-50 to-white px-6 py-8 rounded-xl shadow-sm mb-6 border border-gray-100",
        className
      )}
      role="region"
      aria-labelledby="section-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {icon && (
            <span className="inline-flex items-center justify-center bg-primary/5 rounded-xl p-3 shadow-sm border border-primary/10">
              {icon}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1
                id="section-heading"
                className="font-semibold text-2xl sm:text-3xl tracking-tight text-gray-900"
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
              <p className="mt-1.5 text-base text-gray-600 font-medium">
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
