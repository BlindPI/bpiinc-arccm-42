
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Calendar, TrendingUp } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description?: string;
  status: string;
  team_type?: string;
  performance_score?: number;
  created_at: string;
  locations?: {
    name: string;
    city?: string;
    state?: string;
  };
  member_count: number;
}

interface TeamDetailsDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamDetailsDialog({ team, open, onOpenChange }: TeamDetailsDialogProps) {
  if (!team) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'provider_team':
        return 'bg-blue-100 text-blue-800';
      case 'training_team':
        return 'bg-purple-100 text-purple-800';
      case 'operations':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{team.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge className={getStatusColor(team.status)}>
                    {team.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <Badge className={getTypeColor(team.team_type || 'standard')}>
                    {team.team_type?.replace('_', ' ') || 'Standard'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Members</p>
                  <p className="text-sm">{team.member_count}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Performance</p>
                  <p className="text-sm">{team.performance_score?.toFixed(1) || '0.0'}%</p>
                </div>
              </div>
              
              {team.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm text-gray-700">{team.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Info */}
          {team.locations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{team.locations.name}</p>
                {team.locations.city && (
                  <p className="text-sm text-gray-600">
                    {team.locations.city}, {team.locations.state}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Created: {new Date(team.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
