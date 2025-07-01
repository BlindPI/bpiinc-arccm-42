
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { CourseMatch, CourseMatchType } from '@/components/certificates/types';

interface CourseMatchDisplayProps {
  courseMatch: CourseMatch | null;
  originalCourse?: string;
  confidence?: number;
}

export function CourseMatchDisplay({
  courseMatch,
  originalCourse,
  confidence
}: CourseMatchDisplayProps) {
  if (!courseMatch) {
    return (
      <Card className="p-3 border-destructive/20 bg-destructive/5">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">No course match found</span>
        </div>
        {originalCourse && (
          <p className="text-xs text-muted-foreground mt-1">
            Original: {originalCourse}
          </p>
        )}
      </Card>
    );
  }

  const getMatchIcon = (matchType: CourseMatchType) => {
    switch (matchType) {
      case 'exact':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'fallback':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'default':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'mismatch':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMatchColor = (matchType: CourseMatchType) => {
    switch (matchType) {
      case 'exact':
        return 'border-green-200 bg-green-50';
      case 'partial':
        return 'border-blue-200 bg-blue-50';
      case 'fallback':
        return 'border-orange-200 bg-orange-50';
      case 'default':
        return 'border-yellow-200 bg-yellow-50';
      case 'mismatch':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getBadgeVariant = (matchType: CourseMatchType) => {
    switch (matchType) {
      case 'exact':
        return 'default';
      case 'partial':
        return 'secondary';
      case 'fallback':
        return 'outline';
      case 'default':
        return 'outline';
      case 'mismatch':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className={`p-3 ${getMatchColor(courseMatch.matchType)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getMatchIcon(courseMatch.matchType)}
            <span className="text-sm font-medium">{courseMatch.name}</span>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge variant={getBadgeVariant(courseMatch.matchType)} className="text-xs">
              {courseMatch.matchType.charAt(0).toUpperCase() + courseMatch.matchType.slice(1)} Match
            </Badge>
            {confidence !== undefined && (
              <Badge variant="outline" className="text-xs">
                {Math.round(confidence * 100)}% confidence
              </Badge>
            )}
          </div>

          {courseMatch.certifications && courseMatch.certifications.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Certifications: {courseMatch.certifications.map(cert => 
                `${cert.type} ${cert.level}`
              ).join(', ')}
            </div>
          )}

          {courseMatch.mismatchReason && (
            <div className="text-xs text-destructive mt-1">
              Issue: {courseMatch.mismatchReason}
            </div>
          )}
        </div>
      </div>

      {originalCourse && originalCourse !== courseMatch.name && (
        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-current/20">
          Original: {originalCourse}
        </div>
      )}
    </Card>
  );
}
