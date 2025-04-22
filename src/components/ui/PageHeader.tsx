
import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "w-full bg-gradient-to-br from-blue-50 via-purple-50 to-white px-3 py-6 sm:px-6 rounded-lg shadow-sm mb-2 flex flex-col gap-1 sm:gap-2",
        className
      )}
      role="region"
      aria-labelledby="section-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="inline-flex items-center justify-center bg-white rounded-xl p-2 shadow feature-icon">
              {icon}
            </span>
          )}
          <div>
            <h1
              id="section-heading"
              className="font-semibold text-2xl sm:text-3xl tracking-tight text-gray-900 text-gradient-primary flex items-center gap-1"
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground font-medium">
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

