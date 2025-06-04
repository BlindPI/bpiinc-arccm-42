import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Users,
  Target,
  Calendar,
  Mail,
  DollarSign
} from 'lucide-react';

export const CRMMobileNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      title: 'Dashboard',
      href: '/crm',
      icon: BarChart3
    },
    {
      title: 'Leads',
      href: '/crm/leads',
      icon: Users
    },
    {
      title: 'Pipeline',
      href: '/crm/opportunities',
      icon: Target
    },
    {
      title: 'Activities',
      href: '/crm/activities',
      icon: Calendar
    },
    {
      title: 'Revenue',
      href: '/crm/revenue',
      icon: DollarSign
    }
  ];

  const isActive = (href: string) => {
    if (href === '/crm') {
      return location.pathname === '/crm';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="bg-background border-t">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors",
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};