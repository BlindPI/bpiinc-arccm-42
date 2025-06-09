
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StepBasicInfoProps {
  data: any;
  onChange: (data: any) => void;
}

export function StepBasicInfo({ data, onChange }: StepBasicInfoProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="teamName">Team Name</Label>
        <Input 
          id="teamName"
          value={data.name || ''}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input 
          id="description"
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
        />
      </div>
    </div>
  );
}
