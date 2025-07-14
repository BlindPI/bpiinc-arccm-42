import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Student {
  id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface StudentSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectStudent: (student: Student) => void;
  title: string;
}

export function StudentSelector({ open, onClose, onSelectStudent, title }: StudentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['available-students', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('student_enrollment_profiles')
        .select('id, email, display_name, first_name, last_name')
        .eq('is_active', true)
        .order('display_name', { ascending: true });

      if (searchTerm) {
        query = query.or(`display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as Student[];
    },
    enabled: open,
  });

  const handleSelectStudent = (student: Student) => {
    onSelectStudent(student);
    onClose();
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No students found</p>
              </div>
            ) : (
              students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {student.display_name || `${student.first_name} ${student.last_name}`.trim() || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSelectStudent(student)}
                    className="ml-4"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Select
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}