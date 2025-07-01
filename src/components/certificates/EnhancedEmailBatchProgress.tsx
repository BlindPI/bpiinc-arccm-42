import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Mail, Clock, AlertCircle, Zap, Users, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmailBatchOperation } from '@/types/certificates';

interface EnhancedEmailBatchProgressProps {
  batchId: string;
  onComplete?: () => void;
}

export function EnhancedEmailBatchProgress({ batchId, onComplete }: EnhancedEmailBatchProgressProps) {
  const [isComplete, setIsComplete] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const { data: batchOperation, isLoading } = useQuery({
    queryKey: ['email-batch-progress', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_batch_operations')
        .select('*')
        .eq('id', batchId)
        .single();
      
      if (error) throw error;
      return data as EmailBatchOperation;
    },
    refetchInterval: (query) => {
      // Stop polling when complete or failed
      if (query.state.data?.status === 'COMPLETED' || query.state.data?.status === 'FAILED') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    enabled: !!batchId
  });

  // Animate progress bar
  useEffect(() => {
    if (batchOperation) {
      const targetProgress = batchOperation.total_certificates > 0 
        ? Math.round((batchOperation.processed_certificates / batchOperation.total_certificates) * 100)
        : 0;
      
      // Smooth progress animation
      const timer = setTimeout(() => {
        setAnimatedProgress(targetProgress);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [batchOperation]);

  useEffect(() => {
    if (batchOperation?.status === 'COMPLETED' || batchOperation?.status === 'FAILED') {
      if (!isComplete) {
        setIsComplete(true);
        if (onComplete) {
          setTimeout(onComplete, 2000); // Give user time to see the result
        }
      }
    }
  }, [batchOperation?.status, isComplete, onComplete]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
              >
                <Clock className="h-6 w-6 text-white" />
              </motion.div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">Initializing Email Batch</h3>
                <p className="text-sm text-gray-600">Setting up your email delivery process...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!batchOperation) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-red-800 mb-1">Batch Not Found</h3>
                <p className="text-sm text-red-600">Unable to locate the email batch operation.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const getStatusConfig = () => {
    switch (batchOperation.status) {
      case 'PENDING':
        return {
          badge: (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          ),
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          color: 'amber'
        };
      case 'PROCESSING':
        return {
          badge: (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Send className="h-3 w-3 mr-1" />
              </motion.div>
              Sending...
            </Badge>
          ),
          icon: <Send className="h-5 w-5 text-blue-500" />,
          color: 'blue'
        };
      case 'COMPLETED':
        return {
          badge: (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          ),
          icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
          color: 'emerald'
        };
      case 'FAILED':
        return {
          badge: (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <XCircle className="h-3 w-3 mr-1" />
              Failed
            </Badge>
          ),
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          color: 'red'
        };
      default:
        return {
          badge: null,
          icon: <Clock className="h-5 w-5 text-gray-500" />,
          color: 'gray'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, staggerChildren: 0.1 }}
      className="space-y-4"
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <motion.div 
                className="flex items-center gap-3"
                animate={batchOperation.status === 'PROCESSING' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {statusConfig.icon}
                <span className="text-lg font-semibold text-gray-900">Email Progress</span>
              </motion.div>
              {statusConfig.badge}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 pb-6">
            {/* Progress Section */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">Overall Progress</span>
                <span className="text-gray-600 font-mono">
                  {batchOperation.processed_certificates} / {batchOperation.total_certificates}
                </span>
              </div>
              
              <div className="relative">
                <Progress 
                  value={animatedProgress} 
                  className="h-3 bg-gray-100" 
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${animatedProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r ${
                    statusConfig.color === 'blue' ? 'from-blue-500 to-purple-600' :
                    statusConfig.color === 'emerald' ? 'from-emerald-500 to-green-600' :
                    statusConfig.color === 'red' ? 'from-red-500 to-pink-600' :
                    'from-gray-400 to-gray-500'
                  }`}
                />
              </div>
              
              <div className="text-center">
                <motion.span 
                  className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
                  key={animatedProgress}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {animatedProgress}%
                </motion.span>
                <p className="text-xs text-gray-500 mt-1">Complete</p>
              </div>
            </motion.div>

            {/* Statistics Grid */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Successful</p>
                    <p className="text-lg font-bold text-emerald-900">{batchOperation.successful_emails}</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">Failed</p>
                    <p className="text-lg font-bold text-red-900">{batchOperation.failed_emails}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Batch Information */}
            {batchOperation.batch_name && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Batch Name</p>
                    <p className="text-sm text-blue-700">{batchOperation.batch_name}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            <AnimatePresence>
              {batchOperation.error_message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800">Error Details</p>
                      <p className="text-sm text-red-700 mt-1">{batchOperation.error_message}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {batchOperation.status === 'COMPLETED' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                >
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <CheckCircle className="h-5 w-5 text-white" />
                    </motion.div>
                    <div>
                      <p className="font-semibold text-emerald-800">All Emails Sent Successfully!</p>
                      <p className="text-sm text-emerald-700 mt-1">
                        {batchOperation.successful_emails} certificate{batchOperation.successful_emails !== 1 ? 's' : ''} delivered to recipients.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timestamps */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-100">
                <div className="flex justify-between">
                  <span>Started:</span>
                  <span className="font-mono">{new Date(batchOperation.created_at).toLocaleString()}</span>
                </div>
                {batchOperation.completed_at && (
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-mono">{new Date(batchOperation.completed_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}