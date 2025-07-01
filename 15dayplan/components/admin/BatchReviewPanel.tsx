import React, { useState } from 'react';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Textarea } from '../ui/Textarea';
import { CheckCircle, Loader2, XCircle, AlertCircle } from 'lucide-react';

interface BatchReviewPanelProps {
  submissions: any[];
  onBatchApprove: (submissionIds: string[], note: string) => Promise<void>;
  onBatchReject: (submissionIds: string[], note: string) => Promise<void>;
}

export function BatchReviewPanel({
  submissions,
  onBatchApprove,
  onBatchReject
}: BatchReviewPanelProps) {
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [batchNote, setBatchNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(submissions.map(s => s.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSubmissionSelection = (id: string) => {
    if (selectedSubmissions.includes(id)) {
      setSelectedSubmissions(selectedSubmissions.filter(s => s !== id));
      setSelectAll(false);
    } else {
      setSelectedSubmissions([...selectedSubmissions, id]);
      if (selectedSubmissions.length + 1 === submissions.length) {
        setSelectAll(true);
      }
    }
  };

  const handleBatchApprove = async () => {
    if (selectedSubmissions.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onBatchApprove(selectedSubmissions, batchNote);
      setSelectedSubmissions([]);
      setSelectAll(false);
      setBatchNote('');
    } catch (error) {
      console.error('Error in batch approval:', error);
    } finally {
      setIsProcessing(false);
      setIsApproveDialogOpen(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedSubmissions.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onBatchReject(selectedSubmissions, batchNote);
      setSelectedSubmissions([]);
      setSelectAll(false);
      setBatchNote('');
    } catch (error) {
      console.error('Error in batch rejection:', error);
    } finally {
      setIsProcessing(false);
      setIsRejectDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Processing</CardTitle>
        <CardDescription>
          Select multiple submissions to process them together
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="select-all" 
              checked={selectAll}
              onCheckedChange={toggleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Select All ({submissions.length})
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {submissions.map(submission => (
              <div 
                key={submission.id} 
                className={`flex items-start space-x-2 p-2 rounded-md ${
                  selectedSubmissions.includes(submission.id) ? 'bg-primary/10' : ''
                }`}
              >
                <Checkbox 
                  id={`submission-${submission.id}`}
                  checked={selectedSubmissions.includes(submission.id)}
                  onCheckedChange={() => toggleSubmissionSelection(submission.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor={`submission-${submission.id}`} className="block text-sm font-medium cursor-pointer">
                    {submission.requirement_name}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {submission.user_name} ({submission.user_role})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedSubmissions.length} of {submissions.length} selected
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsRejectDialogOpen(true);
              setBatchNote('');
            }}
            disabled={selectedSubmissions.length === 0}
          >
            <XCircle className="mr-2 h-4 w-4 text-red-500" />
            Reject Selected
          </Button>
          <Button
            onClick={() => {
              setIsApproveDialogOpen(true);
              setBatchNote('');
            }}
            disabled={selectedSubmissions.length === 0}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve Selected
          </Button>
        </div>
      </CardFooter>
      
      {/* Approval Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {selectedSubmissions.length} Submissions</DialogTitle>
            <DialogDescription>
              Add a note that will be applied to all selected submissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Add an optional note for all approved submissions..."
              value={batchNote}
              onChange={(e) => setBatchNote(e.target.value)}
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleBatchApprove} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve {selectedSubmissions.length} Submissions
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision for {selectedSubmissions.length} Submissions</DialogTitle>
            <DialogDescription>
              Add a note explaining why these submissions need revision.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-md">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">A feedback note is required for rejected submissions.</span>
            </div>
            
            <Textarea
              placeholder="Explain why these submissions need revision..."
              value={batchNote}
              onChange={(e) => setBatchNote(e.target.value)}
              rows={4}
              required
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBatchReject} 
              disabled={isProcessing || !batchNote.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Request Revision
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}