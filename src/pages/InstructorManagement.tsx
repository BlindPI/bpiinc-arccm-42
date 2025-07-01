
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, Award, TrendingUp, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTeachingManagement } from '@/hooks/useTeachingManagement';
import { PageHeader } from '@/components/ui/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function InstructorManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const { useInstructorWorkload } = useTeachingManagement();

  // Get all instructors
  const { data: instructors = [], isLoading } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['IC', 'IP', 'IT', 'AP'])
        .eq('status', 'ACTIVE')
        .order('display_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get instructor workload summary
  const { data: workloadData = [] } = useQuery({
    queryKey: ['instructor-workload-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_workload_summary')
        .select('*')
        .order('total_hours_all_time', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'IC': return 'bg-blue-100 text-blue-800';
      case 'IP': return 'bg-yellow-100 text-yellow-800';
      case 'IT': return 'bg-green-100 text-green-800';
      case 'AP': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      'IC': 'Instructor Candidate',
      'IP': 'Instructor Provisional',
      'IT': 'Instructor Trainer',
      'AP': 'Authorized Provider'
    };
    return labels[role] || role;
  };

  const filteredInstructors = instructors.filter(instructor =>
    instructor.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-lg">Loading instructors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users className="h-7 w-7 text-primary" />}
        title="Instructor Management"
        subtitle="Manage instructor workloads, certifications, and performance"
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Instructor
          </Button>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{instructors.length}</div>
                <div className="text-sm text-gray-600">Total Instructors</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {workloadData.reduce((sum, w) => sum + (w.total_hours_all_time || 0), 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Total Hours Taught</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {instructors.filter(i => i.compliance_status).length}
                </div>
                <div className="text-sm text-gray-600">Compliant Instructors</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {workloadData.reduce((sum, w) => sum + (w.sessions_this_month || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Sessions This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workload">Workload Analysis</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredInstructors.map((instructor) => {
              const workload = workloadData.find(w => w.instructor_id === instructor.id);
              
              return (
                <Card key={instructor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{instructor.display_name}</h3>
                          <Badge className={getRoleColor(instructor.role)}>
                            {getRoleLabel(instructor.role)}
                          </Badge>
                          {instructor.compliance_status && (
                            <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-4">{instructor.email}</div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Total Sessions</div>
                            <div className="text-gray-600">{workload?.total_sessions_all_time || 0}</div>
                          </div>
                          <div>
                            <div className="font-medium">Total Hours</div>
                            <div className="text-gray-600">{workload?.total_hours_all_time || 0}</div>
                          </div>
                          <div>
                            <div className="font-medium">This Month</div>
                            <div className="text-gray-600">{workload?.sessions_this_month || 0} sessions</div>
                          </div>
                          <div>
                            <div className="font-medium">Compliance</div>
                            <div className="text-gray-600">{workload?.compliance_percentage || 0}%</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">View Details</Button>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="workload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Instructor Workload Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workloadData.map((workload) => (
                  <div key={workload.instructor_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{workload.display_name}</div>
                      <div className="text-sm text-gray-600">{getRoleLabel(workload.role)}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-8 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{workload.total_sessions_all_time}</div>
                        <div className="text-gray-600">Total Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{workload.hours_this_month}</div>
                        <div className="text-gray-600">Hours This Month</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{workload.compliance_percentage}%</div>
                        <div className="text-gray-600">Compliance</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <Card>
            <CardContent className="text-center py-12">
              <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Certification Management</h3>
              <p className="text-gray-500">Instructor certification tracking will be implemented in Phase 2</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardContent className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Monitoring</h3>
              <p className="text-gray-500">Advanced compliance tracking will be implemented in Phase 2</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
