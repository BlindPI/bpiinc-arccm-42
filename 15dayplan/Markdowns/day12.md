Day 12: Connect All Backend Interactions
12.1 Implement ComplianceService with Real-Time Hooks
// File: src/services/compliance/complianceService.ts

export class ComplianceService {
  static async getUserRequirements(
    userId: string,
    role: string,
    tier: string
  ): Promise<RequirementWithStatus[]> {
    try {
      const { data: requirements, error } = await supabase
        .from('compliance_requirements')
        .select(`
          *,
          compliance_templates!inner(id, role, tier),
          user_compliance_records!left(
            id, 
            status, 
            submission_data, 
            submitted_at, 
            reviewed_at, 
            expiry_date
          )
        `)
        .eq('compliance_templates.role', role)
        .eq('compliance_templates.tier', tier)
        .eq('user_compliance_records.user_id', userId)
        .order('display_order');
        
      if (error) throw error;
      
      return requirements.map(req => this.formatRequirementWithStatus(req, userId));
    } catch (error) {
      console.error('Error fetching requirements:', error);
      throw error;
    }
  }
  
  static async submitRequirement(
    userId: string,
    requirementId: string,
    submissionData: SubmissionData
  ): Promise<SubmissionResult> {
    try {
      // Begin transaction
      const { data: requirement } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('id', requirementId)
        .single();
        
      if (!requirement) {
        throw new Error('Requirement not found');
      }
      
      // Validate submission data against requirement rules
      const validationResult = this.validateSubmission(requirement, submissionData);
      if (!validationResult.valid) {
        return {
          success: false,
          errors: validationResult.errors
        };
      }
      
      // Update user compliance record
      const { data: record, error: recordError } = await supabase
        .from('user_compliance_records')
        .upsert({
          user_id: userId,
          requirement_id: requirementId,
          status: 'submitted',
          submission_data: submissionData,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (recordError) throw recordError;
      
      // Update user's compliance metrics
      await ComplianceIntegrationService.recalculateUserCompliance(userId);
      
      // Process automatic approvals if applicable
      let finalStatus = 'submitted';
      let reviewNotes = null;
      
      if (requirement.auto_approval_rules) {
        const autoApprovalResult = await this.processAutoApproval(
          record.id,
          requirement,
          submissionData
        );
        
        if (autoApprovalResult.approved) {
          finalStatus = 'approved';
          reviewNotes = 'Automatically approved';
          
          // Update record with approval
          await supabase
            .from('user_compliance_records')
            .update({
              status: 'approved',
              reviewed_at: new Date().toISOString(),
              review_notes: reviewNotes
            })
            .eq('id', record.id);
        }
      }
      
      // Create activity log entry
      await this.logComplianceActivity(userId, {
        action: 'requirement_submitted',
        requirementId,
        requirementName: requirement.name,
        oldStatus: 'in_progress',
        newStatus: finalStatus
      });
      
      // Send notifications
      if (finalStatus === 'submitted') {
        await this.notifyReviewers(requirement, userId, submissionData);
      } else if (finalStatus === 'approved') {
        await NotificationService.send({
          userId,
          type: 'requirement_approved',
          title: 'Requirement Automatically Approved',
          message: `Your submission for ${requirement.name} has been automatically approved!`,
          metadata: {
            requirementId,
            status: 'approved'
          }
        });
      }
      
      return {
        success: true,
        record: {
          ...record,
          status: finalStatus
        },
        autoApproved: finalStatus === 'approved'
      };
    } catch (error) {
      console.error('Error submitting requirement:', error);
      throw error;
    }
  }
  
  static async reviewSubmission(
    submissionId: string,
    reviewerId: string,
    decision: 'approve' | 'reject',
    reviewData: ReviewData
  ): Promise<ReviewResult> {
    try {
      // Get submission record
      const { data: record, error: recordError } = await supabase
        .from('user_compliance_records')
        .select(`
          *,
          compliance_requirements(*)
        `)
        .eq('id', submissionId)
        .single();
      
      if (recordError) throw recordError;
      
      // Update record with review decision
      const { error: updateError } = await supabase
        .from('user_compliance_records')
        .update({
          status: decision === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
          review_notes: reviewData.notes,
          review_data: reviewData.metadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);
      
      if (updateError) throw updateError;
      
      // Update user's compliance metrics
      await ComplianceIntegrationService.recalculateUserCompliance(record.user_id);
      
      // Award points if approved
      if (decision === 'approve') {
        await ComplianceIntegrationService.awardCompliancePoints(
          record.user_id,
          record.compliance_requirements.points_value || 10
        );
        
        // Check for milestone achievements
        await ComplianceIntegrationService.checkMilestoneAchievements(
          record.user_id,
          record.compliance_requirements.category
        );
      }
      
      // Create review history record
      await supabase
        .from('compliance_review_history')
        .insert({
          record_id: submissionId,
          requirement_id: record.requirement_id,
          user_id: record.user_id,
          reviewer_id: reviewerId,
          decision,
          notes: reviewData.notes,
          review_data: reviewData.metadata || {},
          created_at: new Date().toISOString()
        });
      
      // Send notification to user
      await NotificationService.send({
        userId: record.user_id,
        type: decision === 'approve' ? 'requirement_approved' : 'requirement_rejected',
        title: decision === 'approve' ? 'Requirement Approved' : 'Requirement Needs Revision',
        message: decision === 'approve'
          ? `Your submission for ${record.compliance_requirements.name} has been approved!`
          : `Your submission for ${record.compliance_requirements.name} needs revision: ${reviewData.notes}`,
        metadata: {
          requirementId: record.requirement_id,
          status: decision === 'approve' ? 'approved' : 'rejected'
        }
      });
      
      // Log review activity
      await this.logComplianceActivity(record.user_id, {
        action: decision === 'approve' ? 'requirement_approved' : 'requirement_rejected',
        requirementId: record.requirement_id,
        requirementName: record.compliance_requirements.name,
        oldStatus: 'submitted',
        newStatus: decision === 'approve' ? 'approved' : 'rejected',
        metadata: {
          reviewerId,
          reviewNotes: reviewData.notes
        }
      });
      
      return {
        success: true,
        record: {
          ...record,
          status: decision === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
          review_notes: reviewData.notes
        }
      };
    } catch (error) {
      console.error('Error reviewing submission:', error);
      throw error;
    }
  }
  
  // Helper method to validate submissions against requirement rules
  private static validateSubmission(
    requirement: ComplianceRequirement,
    submissionData: SubmissionData
  ): ValidationResult {
    const errors: string[] = [];
    const rules = requirement.validation_rules || {};
    
    // Check required fields
    if (rules.required_fields) {
      rules.required_fields.forEach(field => {
        if (!submissionData[field]) {
          errors.push(`Field '${field}' is required`);
        }
      });
    }
    
    // Check file requirements
    if (requirement.ui_component_type === 'file_upload') {
      if (!submissionData.files || submissionData.files.length === 0) {
        errors.push('At least one file must be uploaded');
      } else if (rules.max_files && submissionData.files.length > rules.max_files) {
        errors.push(`Maximum ${rules.max_files} files allowed`);
      }
      
      // Check file types
      if (rules.file_types && submissionData.files) {
        submissionData.files.forEach(file => {
          const extension = file.name.split('.').pop()?.toLowerCase();
          const allowed = Object.values(rules.file_types).flat();
          
          if (extension && !allowed.includes(`.${extension}`)) {
            errors.push(`File type .${extension} is not allowed`);
          }
        });
      }
    }
    
    // Check assessment score requirements
    if (requirement.requirement_type === 'assessment' && rules.min_score) {
      const score = parseFloat(submissionData.score);
      if (isNaN(score) || score < rules.min_score) {
        errors.push(`Minimum score of ${rules.min_score} required`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Helper method to process automatic approvals
  private static async processAutoApproval(
    recordId: string,
    requirement: ComplianceRequirement,
    submissionData: SubmissionData
  ): Promise<{ approved: boolean; reason?: string }> {
    const rules = requirement.auto_approval_rules;
    
    if (!rules || !rules.enabled) {
      return { approved: false };
    }
    
    // Simple rule-based auto approval
    if (rules.always_approve) {
      return { approved: true, reason: 'Auto-approval rule: always approve' };
    }
    
    // Keyword-based approval for text submissions
    if (rules.keyword_match && submissionData.text) {
      const text = submissionData.text.toLowerCase();
      const matchesAll = rules.keyword_match.every(keyword => text.includes(keyword.toLowerCase()));
      
      if (matchesAll) {
        return { approved: true, reason: 'Auto-approval rule: keyword match' };
      }
    }
    
    // File verification for document submissions
    if (rules.verify_documents && submissionData.files && submissionData.files.length > 0) {
      try {
        const verificationResult = await DocumentVerificationService.verifyDocuments(
          submissionData.files.map(f => f.url),
          rules.document_verification_rules || {}
        );
        
        if (verificationResult.verified) {
          return { approved: true, reason: 'Auto-approval rule: document verification' };
        }
      } catch (error) {
        console.error('Document verification error:', error);
        return { approved: false, reason: 'Document verification failed' };
      }
    }
    
    return { approved: false };
  }
}

typescript



12.2 Create Custom React Hooks for Compliance UI
// File: src/hooks/useComplianceRequirements.ts

export function useComplianceRequirements(userId: string, role: string, tier: string) {
  return useQuery({
    queryKey: ['compliance-requirements', userId, role, tier],
    queryFn: () => ComplianceService.getUserRequirements(userId, role, tier),
    enabled: !!userId && !!role && !!tier,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
    onError: (error) => {
      console.error('Error fetching requirements:', error);
      toast.error('Failed to load compliance requirements');
    },
  });
}

export function useRequirementSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      requirementId, 
      submissionData 
    }: { 
      userId: string; 
      requirementId: string; 
      submissionData: SubmissionData;
    }) => {
      return ComplianceService.submitRequirement(userId, requirementId, submissionData);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['compliance-requirements', variables.userId]);
      queryClient.invalidateQueries(['compliance-progress', variables.userId]);
      queryClient.invalidateQueries(['compliance-metrics', variables.userId]);
      
      if (data.autoApproved) {
        toast.success('Requirement automatically approved!');
      } else {
        toast.success('Requirement submitted successfully');
      }
    },
    onError: (error) => {
      console.error('Submission error:', error);
      toast.error('Failed to submit requirement. Please try again.');
    },
  });
}

export function useRequirementReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      submissionId, 
      reviewerId, 
      decision, 
      reviewData 
    }: {
      submissionId: string;
      reviewerId: string;
      decision: 'approve' | 'reject';
      reviewData: ReviewData;
    }) => {
      return ComplianceService.reviewSubmission(submissionId, reviewerId, decision, reviewData);
    },
    onSuccess: (data, variables) => {
      // Get user ID from the record returned
      const userId = data.record.user_id;
      
      queryClient.invalidateQueries(['compliance-requirements', userId]);
      queryClient.invalidateQueries(['compliance-progress', userId]);
      queryClient.invalidateQueries(['compliance-metrics', userId]);
      queryClient.invalidateQueries(['submissions-to-review']);
      
      toast.success(
        variables.decision === 'approve'
          ? 'Requirement approved successfully'
          : 'Requirement returned for revision'
      );
    },
    onError: (error) => {
      console.error('Review error:', error);
      toast.error('Failed to submit review. Please try again.');
    },
  });
}

// Hook for real-time updates
export function useComplianceRealtimeUpdates(userId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Skip if no userId
    if (!userId) return;
    
    const channel = supabase
      .channel(`compliance-updates-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_compliance_records',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Update cache with new data
        queryClient.invalidateQueries(['compliance-requirements', userId]);
        queryClient.invalidateQueries(['compliance-progress', userId]);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'compliance_metrics',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        queryClient.invalidateQueries(['compliance-metrics', userId]);
      })
      .subscribe();
    
    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

typescript



12.3 Implement Document Upload Service
// File: src/services/compliance/documentUploadService.ts

export class DocumentUploadService {
  static async uploadRequirementFile(
    formData: FormData
  ): Promise<UploadResult> {
    try {
      const file = formData.get('file') as File;
      const requirementId = formData.get('requirementId') as string;
      const userId = formData.get('userId') as string;
      
      if (!file || !requirementId || !userId) {
        throw new Error('Missing required parameters');
      }
      
      // Generate unique filename with original extension
      const extension = file.name.split('.').pop();
      const uniqueFileName = `${userId}/${requirementId}/${uuidv4()}.${extension}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('compliance-documents')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('compliance-documents')
        .getPublicUrl(uniqueFileName);
      
      // Create file record in database
      const { data: fileRecord, error: recordError } = await supabase
        .from('compliance_files')
        .insert({
          user_id: userId,
          requirement_id: requirementId,
          storage_path: uniqueFileName,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          public_url: urlData.publicUrl,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (recordError) throw recordError;
      
      // Run virus scan in background (if enabled)
      if (process.env.NEXT_PUBLIC_ENABLE_VIRUS_SCAN === 'true') {
        this.queueVirusScan(fileRecord.id, urlData.publicUrl);
      }
      
      return {
        success: true,
        fileId: fileRecord.id,
        fileName: file.name,
        fileUrl: urlData.publicUrl,
        filePath: uniqueFileName
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
  
  static async deleteFile(fileId: string): Promise<{ success: boolean }> {
    try {
      // Get file record
      const { data: fileRecord, error: fetchError } = await supabase
        .from('compliance_files')
        .select('storage_path')
        .eq('id', fileId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('compliance-documents')
        .remove([fileRecord.storage_path]);
      
      if (storageError) throw storageError;
      
      // Delete record
      const { error: recordError } = await supabase
        .from('compliance_files')
        .delete()
        .eq('id', fileId);
      
      if (recordError) throw recordError;
      
      return { success: true };
    } catch (error) {
      console.error('File deletion error:', error);
      throw error;
    }
  }
  
  static async getFilesByRequirement(
    requirementId: string,
    userId: string
  ): Promise<FileRecord[]> {
    try {
      const { data: files, error } = await supabase
        .from('compliance_files')
        .select('*')
        .eq('requirement_id', requirementId)
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      
      return files;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  }
  
  // Queue file for virus scanning
  private static async queueVirusScan(fileId: string, fileUrl: string): Promise<void> {
    try {
      await supabase.functions.invoke('scan-uploaded-file', {
        body: { fileId, fileUrl }
      });
    } catch (error) {
      console.error('Error queuing virus scan:', error);
      // Don't throw - this is a background process
    }
  }
}

typescript


