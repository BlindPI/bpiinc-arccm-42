
import { Award, Clock } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FormHeaderProps {
  isAdmin: boolean;
}

export function FormHeader({ isAdmin }: FormHeaderProps) {
  return (
    <CardHeader className="space-y-1 border-b bg-card-gradient">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          <CardTitle>{isAdmin ? "Create Certificate" : "Request Certificate"}</CardTitle>
        </div>
        <Badge variant="outline" className="gap-1 bg-white">
          <Clock className="h-3 w-3" />
          <span>{isAdmin ? "Admin" : "Standard"} Process</span>
        </Badge>
      </div>
      <CardDescription className="text-[15px] text-muted-foreground">
        {isAdmin ? 
          "Create a new certificate that will be immediately generated and available." : 
          "Submit a certificate request that will be reviewed by an administrator."
        }
      </CardDescription>
    </CardHeader>
  );
}
