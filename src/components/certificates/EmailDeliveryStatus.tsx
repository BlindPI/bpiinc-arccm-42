import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MailCheck, 
  Mail, 
  MailX, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface EmailDeliveryStatusProps {
  certificateId: string;
  deliveryStatus?: string;
  lastDeliveryAttempt?: string;
  deliveryAttempts?: number;
  bounceReason?: string;
  emailStatus?: string;
  isBatchEmailed?: boolean;
  lastEmailedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showRetryButton?: boolean;
}

export function EmailDeliveryStatus({
  certificateId,
  deliveryStatus,
  lastDeliveryAttempt,
  deliveryAttempts = 0,
  bounceReason,
  emailStatus,
  isBatchEmailed,
  lastEmailedAt,
  size = 'md',
  showRetryButton = true
}: EmailDeliveryStatusProps) {
  const [retrying, setRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();

  const getStatusInfo = () => {
    // Check modern delivery status first
    if (deliveryStatus) {
      switch (deliveryStatus) {
        case 'delivered':
          return {
            variant: 'default' as const,
            icon: <CheckCircle2 className="h-3 w-3" />,
            text: 'Delivered',
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          };
        case 'bounced':
          return {
            variant: 'destructive' as const,
            icon: <XCircle className="h-3 w-3" />,
            text: 'Bounced',
            color: 'text-red-600',
            bgColor: 'bg-red-50'
          };
        case 'failed':
          return {
            variant: 'destructive' as const,
            icon: <MailX className="h-3 w-3" />,
            text: 'Failed',
            color: 'text-red-600',
            bgColor: 'bg-red-50'
          };
        case 'pending':
          return {
            variant: 'secondary' as const,
            icon: <Clock className="h-3 w-3" />,
            text: 'Pending',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50'
          };
        case 'sent':
          return {
            variant: 'outline' as const,
            icon: <Mail className="h-3 w-3" />,
            text: 'Sent',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          };
      }
    }

    // Fallback to legacy email status
    if (emailStatus === 'SENT' || isBatchEmailed) {
      return {
        variant: 'default' as const,
        icon: <MailCheck className="h-3 w-3" />,
        text: 'Sent',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }

    return {
      variant: 'outline' as const,
      icon: <Mail className="h-3 w-3" />,
      text: 'Not Sent',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50'
    };
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const { error } = await supabase.functions.invoke('send-certificate-email', {
        body: { 
          certificateId,
          isRetry: true 
        }
      });

      if (error) throw error;

      toast.success('Email retry initiated');
      
      // Refresh certificate data
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-certificates'] });
      
    } catch (error) {
      console.error('Error retrying email:', error);
      toast.error('Failed to retry email delivery');
    } finally {
      setRetrying(false);
    }
  };

  const statusInfo = getStatusInfo();
  const hasDeliveryIssues = deliveryStatus === 'bounced' || deliveryStatus === 'failed' || deliveryAttempts > 1;
  const canRetry = showRetryButton && (hasDeliveryIssues || deliveryStatus === 'failed');

  const badgeSize = size === 'sm' ? 'text-xs px-1 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-1';

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => setShowDetails(true)}>
              <Badge 
                variant={statusInfo.variant}
                className={`${badgeSize} ${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-1`}
              >
                {statusInfo.icon}
                {statusInfo.text}
              </Badge>
              
              {hasDeliveryIssues && (
                <AlertTriangle className="h-3 w-3 text-orange-500" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              {deliveryStatus ? `Delivery: ${deliveryStatus}` : 'Click for details'}
              {deliveryAttempts > 1 && (
                <div>{deliveryAttempts} delivery attempts</div>
              )}
              {lastDeliveryAttempt && (
                <div>Last attempt: {format(new Date(lastDeliveryAttempt), 'MMM dd, HH:mm')}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {canRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRetry}
          disabled={retrying}
          className="h-6 px-2 text-xs"
        >
          {retrying ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {size !== 'sm' && !retrying && 'Retry'}
        </Button>
      )}

      {/* Delivery Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Delivery Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Status:</span>
              <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                {statusInfo.icon}
                {statusInfo.text}
              </Badge>
            </div>

            {deliveryAttempts > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attempts:</span>
                <span className="text-sm">{deliveryAttempts}</span>
              </div>
            )}

            {lastDeliveryAttempt && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Attempt:</span>
                <span className="text-sm">{format(new Date(lastDeliveryAttempt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            )}

            {lastEmailedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Sent:</span>
                <span className="text-sm">{format(new Date(lastEmailedAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            )}

            {bounceReason && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-red-600">Issue Details:</span>
                <p className="text-sm bg-red-50 p-2 rounded border text-red-700">
                  {bounceReason}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm font-medium">Email Status:</span>
              <span className="text-sm">
                {emailStatus === 'SENT' || isBatchEmailed ? 'Previously Sent' : 'Not Sent'}
              </span>
            </div>

            {canRetry && (
              <div className="pt-4 border-t">
                <Button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full"
                  size="sm"
                >
                  {retrying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Email Delivery
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}