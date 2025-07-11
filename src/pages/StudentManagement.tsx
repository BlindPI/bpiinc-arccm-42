import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Upload, Download, Search } from 'lucide-react';
import { StudentDataTable } from '@/components/student-management/StudentDataTable';
import { StudentDetailModal } from '@/components/student-management/StudentDetailModal';
import { CSVImportModal } from '@/components/student-management/CSVImportModal';
import { useStudentManagement, StudentProfile, StudentFilters, PaginationParams } from '@/hooks/useStudentManagement';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function StudentManagement() {
  const { fetchStudents, updateStudent, deleteStudent, bulkUpdateStatus, isLoading, error } = useStudentManagement();
  
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  
  const [filters, setFilters] = useState<StudentFilters>({});
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Load students
  const loadStudents = useCallback(async () => {
    const result = await fetchStudents(filters, { page: currentPage, pageSize });
    setStudents(result.data);
    setTotalCount(result.count);
  }, [fetchStudents, filters, currentPage, pageSize]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Event handlers
  const handleFiltersChange = (newFilters: StudentFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePaginationChange = (pagination: PaginationParams) => {
    setCurrentPage(pagination.page);
  };

  const handleStudentEdit = (student: StudentProfile) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  const handleStudentSave = async (updates: Partial<StudentProfile>) => {
    if (!selectedStudent) return false;
    
    const success = await updateStudent(selectedStudent.id, updates);
    if (success) {
      await loadStudents(); // Reload data
    }
    return success;
  };

  const handleStudentDelete = async (studentId: string) => {
    if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      const success = await deleteStudent(studentId);
      if (success) {
        await loadStudents(); // Reload data
      }
    }
  };

  const handleBulkAction = async (action: string, studentIds: string[]) => {
    switch (action) {
      case 'activate':
        await bulkUpdateStatus(studentIds, 'ACTIVE');
        break;
      case 'deactivate':
        await bulkUpdateStatus(studentIds, 'INACTIVE');
        break;
      case 'suspend':
        await bulkUpdateStatus(studentIds, 'SUSPENDED');
        break;
      case 'export':
        await handleExportSelected(studentIds);
        break;
    }
    await loadStudents(); // Reload data
  };

  const handleExport = async () => {
    try {
      // Export all filtered students
      const allStudents = await fetchStudents(filters, { page: 1, pageSize: 10000 });
      await exportToCSV(allStudents.data, 'all-students.csv');
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const handleExportSelected = async (studentIds: string[]) => {
    try {
      const selectedStudents = students.filter(s => studentIds.includes(s.id));
      await exportToCSV(selectedStudents, 'selected-students.csv');
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const exportToCSV = async (data: StudentProfile[], filename: string) => {
    const headers = [
      'ID', 'Email', 'First Name', 'Last Name', 'Display Name', 
      'External ID', 'Status', 'Source', 'Import Date', 'Country', 
      'Postal Code', 'Region', 'Enrollments', 'Amount Spent'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(student => [
        student.id,
        student.email,
        student.first_name || '',
        student.last_name || '',
        student.display_name || '',
        student.external_student_id || '',
        student.enrollment_status,
        student.imported_from,
        student.import_date,
        student.student_metadata?.country || '',
        student.student_metadata?.postal_code || '',
        student.student_metadata?.region || '',
        student.student_metadata?.enrollments || 0,
        student.student_metadata?.amount_spent || 0
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${data.length} students to ${filename}`);
  };

  const handleImportComplete = () => {
    loadStudents(); // Reload data after import
  };

  // Get summary statistics
  const activeStudents = students.filter(s => s.is_active && s.enrollment_status === 'ACTIVE').length;
  const totalEnrollments = students.reduce((sum, s) => sum + (s.student_metadata?.enrollments || 0), 0);
  const totalRevenue = students.reduce((sum, s) => sum + (parseFloat(s.student_metadata?.amount_spent) || 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground">
            Manage and track student enrollment profiles and data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button onClick={() => setIsImportModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Students
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {activeStudents} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all students
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Student spending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Student</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalCount > 0 ? (totalRevenue / totalCount).toFixed(0) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue per student
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students Database</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentDataTable
            data={students}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            filters={filters}
            isLoading={isLoading}
            onFiltersChange={handleFiltersChange}
            onPaginationChange={handlePaginationChange}
            onStudentEdit={handleStudentEdit}
            onStudentDelete={handleStudentDelete}
            onBulkAction={handleBulkAction}
            onImportClick={() => setIsImportModalOpen(true)}
            onExport={handleExport}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <StudentDetailModal
        student={selectedStudent}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedStudent(null);
        }}
        onSave={handleStudentSave}
        isLoading={isLoading}
      />

      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}