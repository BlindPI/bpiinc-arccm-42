
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const AuthHeader = () => {
  return (
    <CardHeader className="text-center space-y-2 pb-6">
      <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
        Welcome to Assured Response
      </CardTitle>
      <CardDescription className="text-base text-gray-600">
        Manage your compliance certifications efficiently
      </CardDescription>
    </CardHeader>
  );
};
