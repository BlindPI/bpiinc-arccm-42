import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, MapPin, Mail, Users, Clock, CheckCircle2, Sparkles, Send } from 'lucide-react';
import { Certificate } from '@/types/certificates';
import { EmailBatchProgress } from './EmailBatchProgress';
import { EmailService } from '@/services/emailService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EnhancedBatchCertificateEmailFormProps {
  certificateIds: string[];
  certificates: Certificate[];
  onClose: () => void;
  batchName?: string;
}

export function EnhancedBatchCertificateEmailForm({ 
  certificateIds, 
  certificates, 
  onClose, 
  batchName 
}: EnhancedBatchCertificateEmailFormProps) {
  const [message, setMessage] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  
  // Check if all selected certificates have recipients with emails
  const certsWithoutEmail = certificates
    .filter(cert => !cert.recipient_email)
    .map(cert => cert.recipient_name);
    
  // Check if all selected certificates have certificate URLs
  const certsWithoutUrl = certificates
    .filter(cert => !cert.certificate_url)
    .map(cert => cert.recipient_name);

  // Group certificates by location for proper template handling
  const certificatesByLocation = certificates.reduce((acc: Record<string, Certificate[]>, cert) => {
    const locationId = cert.location_id || 'no-location';
    if (!acc[locationId]) acc[locationId] = [];
    acc[locationId].push(cert);
    return acc;
  }, {});

  const sendBatchEmailsMutation = useMutation({
    mutationFn: async () => {
      const result = await EmailService.sendBatchCertificateEmails({
        certificateIds,
        customMessage: message,
        batchName: batchName || `Batch ${new Date().toISOString().slice(0, 10)}`
      });

      setBatchId(result.batchId);
      setShowProgress(true);
      return result;
    },
    onSuccess: (result) => {
      toast.success(`Batch email process started for ${certificateIds.length} certificates`);
      queryClient.invalidateQueries({ queryKey: ['email-batch-operations'] });
      queryClient.invalidateQueries({ queryKey: ['roster-email-batches'] });
    },
    onError: (error) => {
      console.error('Error sending batch emails:', error);
      toast.error(`Failed to send batch emails: ${error.message}`);
      setShowProgress(false);
      setBatchId(null);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendBatchEmailsMutation.mutate();
  };

  const handleProgressComplete = () => {
    setIsComplete(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  // Success completion screen
  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className="flex flex-col items-center justify-center py-12 px-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="relative mb-6"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center"
          >
            <Sparkles className="h-3 w-3 text-white" />
          </motion.div>
        </motion.div>
        
        <motion.h3 
          className="text-2xl font-semibold text-gray-900 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Emails Sent Successfully!
        </motion.h3>
        
        <motion.p 
          className="text-gray-600 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          All certificate emails have been delivered to recipients.
        </motion.p>
      </motion.div>
    );
  }

  // Progress view
  if (showProgress && batchId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sending Certificate Emails
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Processing your batch email request. This may take a few moments...
            </DialogDescription>
          </DialogHeader>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <EmailBatchProgress
            batchId={batchId}
            onComplete={handleProgressComplete}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <DialogFooter>
            <Button variant="outline" onClick={onClose} className="min-w-24">
              Close
            </Button>
          </DialogFooter>
        </motion.div>
      </motion.div>
    );
  }

  // Main form
  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DialogHeader className="text-center pb-2">
          <motion.div
            className="flex items-center justify-center mb-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
          </motion.div>
          
          <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Send Certificate Emails
          </DialogTitle>
          
          <DialogDescription className="text-gray-600 mt-2 max-w-md mx-auto">
            Deliver certificates to multiple recipients using personalized, location-specific email templates.
          </DialogDescription>
        </DialogHeader>
      </motion.div>

      {/* Batch Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{certificates.length} Recipients</span>
                </div>
                {Object.keys(certificatesByLocation).length > 1 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <MapPin className="h-3 w-3 mr-1" />
                    {Object.keys(certificatesByLocation).length} Locations
                  </Badge>
                )}
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-5 w-5 text-blue-500" />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Warning Alerts */}
      <AnimatePresence>
        {certsWithoutEmail.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3 }}
          >
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-red-800">Missing Email Addresses</AlertTitle>
              <AlertDescription className="text-red-700">
                {certsWithoutEmail.length} recipient{certsWithoutEmail.length > 1 ? 's' : ''} will be skipped due to missing email addresses.
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">View affected recipients</summary>
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    {certsWithoutEmail.map(name => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </details>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        {certsWithoutUrl.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.4 }}
          >
            <Alert variant="destructive" className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Certificates Not Generated</AlertTitle>
              <AlertDescription className="text-amber-700">
                {certsWithoutUrl.length} certificate{certsWithoutUrl.length > 1 ? 's' : ''} haven't been generated yet and will be skipped.
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">View affected recipients</summary>
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    {certsWithoutUrl.map(name => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </details>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        {Object.keys(certificatesByLocation).length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.5 }}
          >
            <Alert className="border-blue-200 bg-blue-50">
              <MapPin className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Multiple Locations</AlertTitle>
              <AlertDescription className="text-blue-700">
                Certificates will use location-specific email templates automatically.
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(certificatesByLocation).map(([locationId, certs]) => (
                    <Badge key={locationId} variant="outline" className="justify-between bg-white">
                      <span>{locationId === 'no-location' ? 'Default' : `Location ${locationId.slice(-8)}`}</span>
                      <span className="ml-2 text-xs">{certs.length}</span>
                    </Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Message */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Label htmlFor="message" className="text-sm font-medium text-gray-700">
          Personal Message <span className="text-gray-400 font-normal">(optional)</span>
        </Label>
        <motion.div
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Textarea
            id="message"
            placeholder="Add a personalized message to include with all certificates..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px] resize-none border-gray-200 focus:border-blue-400 focus:ring-blue-400 transition-colors duration-200"
          />
        </motion.div>
        <p className="text-xs text-gray-500">
          This message will be included in all emails along with the certificate attachments.
        </p>
      </motion.div>

      {/* Footer Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <DialogFooter className="gap-3 pt-4">
          <DialogClose asChild>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="min-w-24"
            >
              Cancel
            </Button>
          </DialogClose>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button 
              type="submit" 
              disabled={sendBatchEmailsMutation.isPending}
              className="min-w-32 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              {sendBatchEmailsMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Starting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  <span>Send Emails</span>
                </div>
              )}
            </Button>
          </motion.div>
        </DialogFooter>
      </motion.div>
    </motion.form>
  );
}