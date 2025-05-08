
import React, { useState, useEffect } from 'react';
import { useCertificationLevelTypes } from '@/hooks/useCertificationLevelTypes';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCertificationLevels } from '@/hooks/useCertificationLevels';
import { toast } from 'sonner';

// Define form schema for validation
const formSchema = z.object({
  type: z.string().min(2, { message: 'Type name must be at least 2 characters' })
    .refine(val => /^[A-Z0-9_]+$/.test(val), {
      message: 'Type must contain only uppercase letters, numbers, and underscores'
    })
});

export function CertificationTypeManager() {
  const [isAddingType, setIsAddingType] = useState(false);
  const { certificationTypes, isLoading, addCertificationType } = useCertificationLevelTypes();
  const { certificationLevels } = useCertificationLevels();
  const [typeLevelCounts, setTypeLevelCounts] = useState<Record<string, number>>({});
  
  // Set up form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: '',
    }
  });

  // Calculate level counts for each type
  useEffect(() => {
    const counts: Record<string, number> = {};
    certificationLevels.forEach(level => {
      if (!counts[level.type]) counts[level.type] = 0;
      counts[level.type]++;
    });
    setTypeLevelCounts(counts);
  }, [certificationLevels]);

  const handleSubmit = form.handleSubmit((data) => {
    if (certificationTypes.includes(data.type)) {
      toast.error("This certification type already exists");
      return;
    }
    
    addCertificationType.mutate(data.type, {
      onSuccess: () => {
        toast.success(`Certification type "${data.type}" added successfully`);
        setIsAddingType(false);
        form.reset();
      },
      onError: () => {
        toast.error("Failed to add certification type");
      }
    });
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Certification Types</CardTitle>
          <CardDescription>
            Manage the types of certification levels available in the system
          </CardDescription>
        </div>
        {!isAddingType && (
          <Button onClick={() => setIsAddingType(true)} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Type
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAddingType && (
          <Card className="mb-6 border-dashed border-primary/50 bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Add New Certification Type</CardTitle>
              <CardDescription>
                Create a new certification type for categorizing certification levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., FIRST_AID, CPR, AED" 
                            {...field} 
                            className="uppercase"
                            autoFocus
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Use uppercase letters, numbers and underscores (e.g., FIRST_AID)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => {
                        setIsAddingType(false);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={addCertificationType.isPending}
                    >
                      {addCertificationType.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Type
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : certificationTypes.length === 0 ? (
          <Alert>
            <AlertDescription>
              No certification types defined yet. Add your first certification type to begin.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type Name</TableHead>
                  <TableHead>Certification Levels</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificationTypes.map((type) => (
                  <TableRow key={type}>
                    <TableCell className="font-medium">{type}</TableCell>
                    <TableCell>
                      {typeLevelCounts[type] || 0} level{typeLevelCounts[type] !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-100">
          <h3 className="text-sm font-medium flex items-center text-blue-800">
            <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
            How Certification Types Work
          </h3>
          <p className="mt-2 text-sm text-blue-700">
            Certification types categorize different certification levels. After adding a type, 
            you can create certification levels for that type and associate them with specific course types.
          </p>
          <div className="mt-2 text-sm text-blue-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <span>
              Example: Create types like "FIRST_AID", "CPR", or "WATER_SAFETY" first, then add specific 
              certification levels like "Standard First Aid" or "CPR Level C" under each type.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
