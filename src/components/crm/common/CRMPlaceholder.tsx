import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

interface CRMPlaceholderProps {
  title: string;
  description: string;
  features?: string[];
}

export const CRMPlaceholder: React.FC<CRMPlaceholderProps> = ({
  title,
  description,
  features = []
}) => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/crm')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to CRM Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Construction className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-lg">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-3">Development Status</h3>
              <p className="text-sm text-muted-foreground">
                This module is currently in development as part of Phase 2 of the CRM implementation. 
                The backend services and database schema are complete and ready for frontend integration.
              </p>
            </div>

            {features.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Planned Features</h3>
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Ready for Development</h4>
              <p className="text-sm text-blue-800">
                All backend services, database tables, and TypeScript types are implemented and tested. 
                This module can be developed using the existing CRM service layer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};