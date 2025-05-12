
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DashboardActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  buttonText: string;
  highlight?: boolean;
}

export function DashboardActionCard({
  title,
  description,
  icon,
  to,
  buttonText,
  highlight = false
}: DashboardActionCardProps) {
  return (
    <Card className={cn(
      "shadow-md transition-all hover:shadow-lg",
      highlight ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white" : "bg-white"
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start">
          <div className={cn(
            "mr-4 rounded-full p-2 bg-gradient-to-br",
            highlight ? "from-amber-100 to-amber-50 text-amber-600" : "from-blue-100 to-blue-50 text-blue-600"
          )}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-6">
        <Button asChild variant={highlight ? "default" : "secondary"} className="w-full">
          <Link to={to}>
            {buttonText}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
