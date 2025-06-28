
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface NavigationBreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  onNavigate?: (href: string) => void;
}

export function NavigationBreadcrumb({
  items,
  showHome = true,
  onNavigate,
}: NavigationBreadcrumbProps) {
  const handleClick = (href: string, e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(href);
    }
  };

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {showHome && (
          <li>
            <div className="flex items-center">
              <a
                href="/"
                onClick={(e) => handleClick('/', e)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </a>
            </div>
          </li>
        )}
        
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              {(showHome || index > 0) && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              )}
              
              {item.current ? (
                <span className="text-sm font-medium text-gray-500">
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  onClick={(e) => item.href && handleClick(item.href, e)}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
