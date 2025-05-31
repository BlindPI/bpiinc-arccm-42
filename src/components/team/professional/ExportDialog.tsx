
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from 'lucide-react';

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

interface ExportDialogProps {
  teams: Team[];
  selectedTeams: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ teams, selectedTeams, open, onOpenChange }: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState('csv');
  const [includeFields, setIncludeFields] = useState({
    name: true,
    description: true,
    status: true,
    team_type: true,
    performance_score: true,
    location: true,
    member_count: true,
    created_at: true,
  });

  const handleFieldChange = (field: string, checked: boolean) => {
    setIncludeFields(prev => ({ ...prev, [field]: checked }));
  };

  const handleExport = () => {
    const teamsToExport = selectedTeams.length > 0 
      ? teams.filter(team => selectedTeams.includes(team.id))
      : teams;

    if (exportFormat === 'csv') {
      exportToCSV(teamsToExport);
    }
    onOpenChange(false);
  };

  const exportToCSV = (data: Team[]) => {
    const headers = [];
    if (includeFields.name) headers.push('Team Name');
    if (includeFields.description) headers.push('Description');
    if (includeFields.status) headers.push('Status');
    if (includeFields.team_type) headers.push('Team Type');
    if (includeFields.performance_score) headers.push('Performance Score');
    if (includeFields.location) headers.push('Location');
    if (includeFields.member_count) headers.push('Member Count');
    if (includeFields.created_at) headers.push('Created Date');

    const csvContent = [
      headers.join(','),
      ...data.map(team => {
        const row = [];
        if (includeFields.name) row.push(`"${team.name}"`);
        if (includeFields.description) row.push(`"${team.description || ''}"`);
        if (includeFields.status) row.push(`"${team.status}"`);
        if (includeFields.team_type) row.push(`"${team.team_type || 'standard'}"`);
        if (includeFields.performance_score) row.push(team.performance_score?.toFixed(2) || '0.00');
        if (includeFields.location) row.push(`"${team.locations?.name || 'No location'}"`);
        if (includeFields.member_count) row.push(team.member_count.toString());
        if (includeFields.created_at) row.push(`"${new Date(team.created_at).toLocaleDateString()}"`);
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `teams_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Teams
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Include Fields</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(includeFields).map(([field, checked]) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={checked}
                    onCheckedChange={(checked) => handleFieldChange(field, !!checked)}
                  />
                  <Label htmlFor={field} className="text-sm capitalize">
                    {field.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {selectedTeams.length > 0 
              ? `Exporting ${selectedTeams.length} selected teams`
              : `Exporting all ${teams.length} teams`
            }
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
