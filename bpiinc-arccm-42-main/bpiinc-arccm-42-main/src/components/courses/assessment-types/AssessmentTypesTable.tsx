
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAssessmentTypes } from '@/hooks/useAssessmentTypes';
import { AssessmentTypeDialog } from './AssessmentTypeDialog';
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
import { Badge } from '@/components/ui/badge';
import { Plus, PencilIcon, PowerIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function AssessmentTypesTable() {
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  const {
    assessmentTypes,
    isLoading,
    createAssessmentType,
    updateAssessmentType,
    toggleAssessmentTypeStatus,
  } = useAssessmentTypes();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingType, setEditingType] = React.useState(undefined);
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleAddClick = () => {
    setEditingType(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (type) => {
    setEditingType(type);
    setDialogOpen(true);
  };

  const handleToggleStatus = (type) => {
    toggleAssessmentTypeStatus.mutate({
      id: type.id,
      active: !type.active,
    });
  };

  const handleSubmit = (data) => {
    if (data.id) {
      updateAssessmentType.mutate(data);
    } else {
      createAssessmentType.mutate(data);
    }
    setDialogOpen(false);
  };

  // Filter assessment types based on search term
  const filteredAssessmentTypes = React.useMemo(() => {
    if (!searchTerm.trim()) return assessmentTypes;
    
    return assessmentTypes.filter(type => 
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [assessmentTypes, searchTerm]);

  if (!isAdmin) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Assessment Types</CardTitle>
            <CardDescription>Manage assessment types for course evaluation</CardDescription>
          </div>
          <Button onClick={handleAddClick} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Assessment Type
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assessment types..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessmentTypes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center h-24 text-muted-foreground"
                      >
                        {searchTerm ? 'No matching assessment types found' : 'No assessment types found. Add your first one.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssessmentTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell>{type.description || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={type.active ? "default" : "outline"}
                            className={
                              type.active
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {type.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(type.updated_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditClick(type)}
                            title="Edit Assessment Type"
                          >
                            <PencilIcon className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleStatus(type)}
                            title={type.active ? "Deactivate Assessment Type" : "Activate Assessment Type"}
                          >
                            <PowerIcon
                              className={`h-4 w-4 ${
                                type.active ? "text-green-500" : "text-red-500"
                              }`}
                            />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AssessmentTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingType}
      />
    </>
  );
}
