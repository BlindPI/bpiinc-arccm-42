
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  MapPin,
  Eye, 
  Award,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { RosterWithRelations } from '@/types/roster';
import { format } from 'date-fns';
import { RosterEmailActions } from './RosterEmailActions';
import { useRosterCertificateCount } from '@/hooks/useRosterCertificateCount';

interface EnhancedRosterCardProps {
  roster: RosterWithRelations;
  canManage: boolean;
}

export function EnhancedRosterCard({ roster, canManage }: EnhancedRosterCardProps) {
  const { actualCount, fixCount, isFixing } = useRosterCertificateCount(roster.id);
  const countMismatch = actualCount !== undefined && actualCount !== roster.certificate_count;

  const getStatusBadge = () => {
    switch (roster.status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'ARCHIVED':
        return <Badge variant="secondary">Archived</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{roster.status}</Badge>;
    }
  };

  return (
    <Card className="border rounded-md shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-semibold text-lg">{roster.name}</span>
              {getStatusBadge()}
            </div>
            
            {/* Description */}
            {roster.description && (
              <p className="text-sm text-gray-600">{roster.description}</p>
            )}
            
            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {/* Course */}
              {roster.course && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Course:</span>
                    <div className="font-medium">{roster.course.name}</div>
                  </div>
                </div>
              )}
              
              {/* Location */}
              {roster.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <div className="font-medium">{roster.location.name}</div>
                    {roster.location.city && (
                      <div className="text-xs text-gray-400">
                        {roster.location.city}, {roster.location.state_province}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Certificate Count */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-gray-500">Certificates:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{roster.certificate_count}</span>
                    {countMismatch && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-600">
                          (Actual: {actualCount})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fixCount(actualCount!)}
                          disabled={isFixing}
                          className="h-6 px-2 text-xs"
                        >
                          Fix
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dates */}
            <div className="flex gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created: {format(new Date(roster.created_at), 'MMM dd, yyyy')}
              </div>
              {roster.issue_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Issue Date: {format(new Date(roster.issue_date), 'MMM dd, yyyy')}
                </div>
              )}
            </div>
            
            {/* Creator */}
            {roster.creator && (
              <div className="text-xs text-gray-500">
                Created by: {roster.creator.display_name || roster.creator.email}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            
            {canManage && roster.certificate_count > 0 && (
              <RosterEmailActions 
                rosterId={roster.id}
                certificateCount={roster.certificate_count}
              />
            )}
            
            {canManage && (
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-1" />
                Generate Report
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
