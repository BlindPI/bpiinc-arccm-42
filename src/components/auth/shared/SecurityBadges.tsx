
import { Shield, Lock, CheckCircle } from 'lucide-react';

export const SecurityBadges = () => {
  return (
    <div className="flex justify-center gap-4 py-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Shield className="h-4 w-4 text-primary" />
        <span>Enterprise Security</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Lock className="h-4 w-4 text-primary" />
        <span>ISO 27001</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CheckCircle className="h-4 w-4 text-primary" />
        <span>SOC 2</span>
      </div>
    </div>
  );
};
