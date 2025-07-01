import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Textarea } from '../ui/Textarea';
import { format } from 'date-fns';
import { Send, Trash } from 'lucide-react';

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_role: string;
  content: string;
  created_at: string;
  is_internal: boolean;
}

interface SubmissionCommentSystemProps {
  submissionId: string;
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
  currentUserAvatar?: string;
  allowInternalNotes: boolean;
}

export function SubmissionCommentSystem({
  submissionId,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
  allowInternalNotes
}: SubmissionCommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/compliance/comments/${submissionId}`);
        const data = await response.json();
        setComments(data.comments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [submissionId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSending(true);
    try {
      const response = await fetch('/api/compliance/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission_id: submissionId,
          content: newComment,
          is_internal: isInternalNote,
        }),
      });
      
      const data = await response.json();
      
      // Add new comment to the list
      setComments([
        ...comments,
        {
          id: data.comment.id,
          user_id: currentUserId,
          user_name: currentUserName,
          user_avatar: currentUserAvatar,
          user_role: currentUserRole,
          content: newComment,
          created_at: new Date().toISOString(),
          is_internal: isInternalNote
        }
      ]);
      
      // Clear form
      setNewComment('');
      setIsInternalNote(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await fetch(`/api/compliance/comments/${commentId}`, {
        method: 'DELETE',
      });
      
      // Remove comment from list
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'reviewer':
        return 'bg-blue-100 text-blue-700';
      case 'IT':
        return 'bg-purple-100 text-purple-700';
      case 'IP':
        return 'bg-green-100 text-green-700';
      case 'IC':
        return 'bg-orange-100 text-orange-700';
      case 'AP':
        return 'bg-teal-100 text-teal-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments & Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No comments yet
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div 
                  key={comment.id} 
                  className={`flex gap-3 ${
                    comment.is_internal ? 'bg-amber-50 p-3 rounded-md' : ''
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    {comment.user_avatar ? (
                      <AvatarImage src={comment.user_avatar} alt={comment.user_name} />
                    ) : null}
                    <AvatarFallback className={getRoleColor(comment.user_role)}>
                      {getUserInitials(comment.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.user_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(comment.user_role)}`}>
                          {comment.user_role}
                        </span>
                        {comment.is_internal && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Internal Note
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'MMM d, yyyy • h:mm a')}
                        </span>
                        
                        {comment.user_id === currentUserId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="pt-4 border-t space-y-3">
            <Textarea
              placeholder="Add a comment or feedback..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            
            <div className="flex justify-between items-center">
              {allowInternalNotes && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="internal-note"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="internal-note" className="text-sm cursor-pointer">
                    Internal note (only visible to reviewers)
                  </label>
                </div>
              )}
              
              <Button 
                onClick={handleAddComment} 
                disabled={!newComment.trim() || isSending}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}