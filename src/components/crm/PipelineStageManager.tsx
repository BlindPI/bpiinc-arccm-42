
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, GripVertical } from 'lucide-react';

// Simple drag and drop implementation without react-beautiful-dnd
interface PipelineStage {
  id: string;
  name: string;
  order: number;
  description?: string;
}

export function PipelineStageManager() {
  const [stages, setStages] = useState<PipelineStage[]>([
    { id: '1', name: 'Prospecting', order: 1, description: 'Initial lead qualification' },
    { id: '2', name: 'Qualification', order: 2, description: 'Verify fit and budget' },
    { id: '3', name: 'Proposal', order: 3, description: 'Proposal submitted' },
    { id: '4', name: 'Negotiation', order: 4, description: 'Terms negotiation' },
    { id: '5', name: 'Closed Won', order: 5, description: 'Deal closed successfully' }
  ]);

  const [newStageName, setNewStageName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const addStage = () => {
    if (!newStageName.trim()) return;
    
    const newStage: PipelineStage = {
      id: Date.now().toString(),
      name: newStageName,
      order: stages.length + 1
    };
    
    setStages([...stages, newStage]);
    setNewStageName('');
  };

  const deleteStage = (id: string) => {
    setStages(stages.filter(stage => stage.id !== id));
  };

  const moveStage = (id: string, direction: 'up' | 'down') => {
    const index = stages.findIndex(stage => stage.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;
    
    const newStages = [...stages];
    [newStages[index], newStages[newIndex]] = [newStages[newIndex], newStages[index]];
    
    // Update order numbers
    newStages.forEach((stage, i) => {
      stage.order = i + 1;
    });
    
    setStages(newStages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Stage Management</CardTitle>
        <CardDescription>
          Configure and manage your sales pipeline stages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Stage */}
        <div className="flex gap-2">
          <Input
            placeholder="New stage name"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addStage()}
          />
          <Button onClick={addStage}>Add Stage</Button>
        </div>

        {/* Stages List */}
        <div className="space-y-2">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
              
              <Badge variant="outline" className="min-w-[2rem] justify-center">
                {stage.order}
              </Badge>
              
              <div className="flex-1">
                <div className="font-medium">{stage.name}</div>
                {stage.description && (
                  <div className="text-sm text-gray-500">{stage.description}</div>
                )}
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveStage(stage.id, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveStage(stage.id, 'down')}
                  disabled={index === stages.length - 1}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingId(stage.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteStage(stage.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
