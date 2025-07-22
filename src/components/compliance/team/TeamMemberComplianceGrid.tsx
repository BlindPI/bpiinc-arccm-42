import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Search,
  Filter,
  User,
  Mail,
  Calendar,
  FileText
} from 'lucide-react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';

export function TeamMemberComplianceGrid() {
  const { state } = useComplianceDashboard();
  const { teamMemberCompliance } = state.data;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Get unique teams for filtering
  const uniqueTeams = Array.from(new Set(teamMemberCompliance.map(member => member.team_name)));

  // Filter members based on search and filters
  const filteredMembers = teamMemberCompliance.filter(member => {
    const matchesSearch = member.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.member_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.compliance_status === statusFilter;
    const matchesTeam = teamFilter === 'all' || member.team_name === teamFilter;
    
    return matchesSearch && matchesStatus && matchesTeam;
  });

  // Sort members by compliance status and score
  const sortedMembers = filteredMembers.sort((a, b) => {
    // Priority order: non_compliant > warning > pending > compliant
    const statusOrder = { non_compliant: 4, warning: 3, pending: 2, compliant: 1 };
    const statusDiff = statusOrder[b.compliance_status] - statusOrder[a.compliance_status];
    
    if (statusDiff !== 0) return statusDiff;
    
    // Then by score (lower scores first for attention)
    return a.compliance_score - b.compliance_score;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'non_compliant':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'non_compliant':
        return <AlertTriangle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Member Compliance
            <Badge variant="outline">{filteredMembers.length} members</Badge>
          </CardTitle>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="compliant">Compliant</option>
            <option value="warning">Warning</option>
            <option value="non_compliant">Non-Compliant</option>
            <option value="pending">Pending</option>
          </select>

          {uniqueTeams.length > 1 && (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Teams</option>
              {uniqueTeams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {sortedMembers.length > 0 ? (
          <div className="grid gap-4">
            {sortedMembers.map((member) => (
              <div key={member.user_id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{member.member_name}</span>
                      </div>
                      <Badge variant="outline">{member.member_role}</Badge>
                      <Badge 
                        variant="outline"
                        className={getStatusColor(member.compliance_status)}
                      >
                        {getStatusIcon(member.compliance_status)}
                        {member.compliance_status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.member_email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {member.team_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Updated {formatDate(member.last_updated)}
                      </span>
                    </div>

                    {/* Compliance Score */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Compliance Score</span>
                        <span className="text-sm font-semibold">{member.compliance_score}%</span>
                      </div>
                      <Progress value={member.compliance_score} className="h-2" />
                    </div>

                    {/* Action Items */}
                    {(member.pending_actions > 0 || member.overdue_actions > 0) && (
                      <div className="flex gap-4 text-sm">
                        {member.pending_actions > 0 && (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Clock className="h-3 w-3" />
                            {member.pending_actions} pending
                          </span>
                        )}
                        {member.overdue_actions > 0 && (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            {member.overdue_actions} overdue
                          </span>
                        )}
                      </div>
                    )}

                    {/* Requirements Preview */}
                    {member.requirements && member.requirements.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">Requirements</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {member.requirements.slice(0, 3).map((req, index) => (
                            <Badge 
                              key={index}
                              variant="outline"
                              className={getStatusColor(req.status)}
                            >
                              {req.name}
                            </Badge>
                          ))}
                          {member.requirements.length > 3 && (
                            <Badge variant="outline">
                              +{member.requirements.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {teamMemberCompliance.length === 0 ? (
              <>
                <Users className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No team members found</p>
                <p className="text-sm">No team members are assigned to you at this time.</p>
              </>
            ) : (
              <>
                <Search className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No members match your filters</p>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}