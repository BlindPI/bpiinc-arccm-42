
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import type { SimpleTeam } from '@/types/simplified-team-management';

interface TeamSettingsModalProps {
  team: SimpleTeam;
  canEdit: boolean;
  onSave: (updates: Partial<SimpleTeam>) => void;
  onClose: () => void;
}

export function TeamSettingsModal({
  team,
  canEdit,
  onSave,
  onClose
}: TeamSettingsModalProps) {
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || '',
    status: team.status,
    performance_score: team.performance_score || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Team Settings - {team.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={!canEdit}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={!canEdit}
              placeholder="Team description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                setFormData(prev => ({ ...prev, status: value }))
              }
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="performance-score">Performance Score (%)</Label>
            <Input
              id="performance-score"
              type="number"
              min="0"
              max="100"
              value={formData.performance_score}
              onChange={(e) => setFormData(prev => ({ ...prev, performance_score: parseInt(e.target.value) || 0 }))}
              disabled={!canEdit}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              {canEdit ? 'Cancel' : 'Close'}
            </Button>
            {canEdit && (
              <Button type="submit" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
