// src/components/index.ts
// Central exports file for all components
// This allows for cleaner imports throughout the application

// Layout components
export { DashboardLayout } from './DashboardLayout';
export { PageHeader } from './ui/PageHeader';

// Location management components
export { default as LocationForm } from './LocationForm';
export * from './LocationForm';
export { default as LocationTable } from './LocationTable';
export * from './LocationTable';
export { LocationSearch } from './LocationSearch';
export { LocationSelector } from './certificates/LocationSelector';
export { LocationEmailTemplateManager, TemplateEditorDialog, DeleteTemplateDialog } from './locations/LocationEmailTemplateManager';

// Certificate components
export { BatchCertificateEmailForm } from './certificates/BatchCertificateEmailForm';
export { BatchEmailAction } from './certificates/BatchEmailAction';
export { EmailCertificateForm } from './certificates/EmailCertificateForm';

// Notification components
export { EmailConfigurationTool } from './notifications/EmailConfigurationTool';
export { EmailDiagnosticTool } from './notifications/EmailDiagnosticTool';

// UI components
export { Button } from './ui/button';
export { Input } from './ui/input';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
export { Label } from './ui/label';
export { Switch } from './ui/switch';
export { Textarea } from './ui/textarea';
export { Badge } from './ui/badge';
export { Alert, AlertDescription } from './ui/alert';
export { Progress } from './ui/progress';

// Add any other components as needed