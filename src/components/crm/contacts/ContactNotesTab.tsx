
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText } from 'lucide-react';

interface ContactNotesTabProps {
  contactId: string;
}

export function ContactNotesTab({ contactId }: ContactNotesTabProps) {
  const [newNote, setNewNote] = useState('');
  const [notes] = useState([
    {
      id: '1',
      content: 'Had a productive call about training requirements. They are interested in first aid certification for 25 employees.',
      created_at: new Date().toISOString(),
      created_by: 'John Doe'
    }
  ]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      // Add note logic here
      setNewNote('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Notes</h3>
      </div>

      {/* Add New Note */}
      <div className="space-y-3">
        <Textarea
          placeholder="Add a note about this contact..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
        />
        <Button onClick={handleAddNote} disabled={!newNote.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No notes yet</p>
            <p className="text-sm">Add notes to keep track of important information</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-4 border rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                <span>By {note.created_by}</span>
                <span>{new Date(note.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
