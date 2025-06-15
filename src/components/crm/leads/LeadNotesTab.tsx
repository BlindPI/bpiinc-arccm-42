
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  FileText, 
  Calendar,
  User,
  Edit,
  Trash2
} from 'lucide-react';

interface LeadNotesTabProps {
  leadId: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export function LeadNotesTab({ leadId }: LeadNotesTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Initial Contact',
      content: 'Reached out via phone. Very interested in emergency response training for their team of 25 employees. Budget approved for Q1.',
      createdAt: new Date().toISOString(),
      createdBy: 'Current User'
    }
  ]);

  const handleSaveNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      createdAt: new Date().toISOString(),
      createdBy: 'Current User'
    };

    setNotes([note, ...notes]);
    setNewNote({ title: '', content: '' });
    setShowCreateForm(false);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notes & Comments</h3>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Create Note Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Title</label>
              <Input
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Content</label>
              <Textarea
                placeholder="Add your note here..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                rows={4}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveNote}>Save Note</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">No notes yet</p>
              <p className="text-sm text-gray-400 mb-4">Add notes to track important information</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Note
              </Button>
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{note.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{note.content}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {note.createdBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
