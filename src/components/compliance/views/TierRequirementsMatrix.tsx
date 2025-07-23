/**
 * TIER REQUIREMENTS MATRIX
 * 
 * Shows clear side-by-side comparison of Basic vs Robust tier requirements
 * with specific details about what users need to provide for compliance.
 * 
 * Features:
 * - Side-by-side Basic vs Robust comparison
 * - Detailed requirement specifications
 * - Document upload requirements
 * - Clear visibility of what users must supply
 * - Role-based requirement filtering
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Shield,
  Award,
  BookOpen,
  FileCheck,
  GraduationCap
} from 'lucide-react';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';
import type { RoleComplianceTemplate, ComplianceRequirementTemplate } from '@/services/compliance/complianceRequirementsService';

interface TierRequirementsMatrixProps {
  userRole: 'AP' | 'IC' | 'IP' | 'IT' | 'SA' | 'AD';
  currentTier: 'basic' | 'robust';
  onUploadDocument?: (requirementName: string, tier: 'basic' | 'robust') => void;
  onTierSwitch?: (newTier: 'basic' | 'robust') => void;
  userComplianceRecords?: any[];
  className?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'certification': return Award;
    case 'training': return GraduationCap;
    case 'documentation': return FileText;
    case 'background_check': return Shield;
    case 'continuing_education': return BookOpen;
    default: return FileCheck;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'certification': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'training': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'documentation': return 'bg-green-100 text-green-800 border-green-200';
    case 'background_check': return 'bg-red-100 text-red-800 border-red-200';
    case 'continuing_education': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const RequirementCard: React.FC<{
  requirement: ComplianceRequirementTemplate;
  tier: 'basic' | 'robust';
  userRole: string;
  complianceStatus?: 'compliant' | 'non_compliant' | 'warning' | 'pending' | 'not_applicable';
  onUploadDocument?: (requirementName: string, tier: 'basic' | 'robust') => void;
}> = ({ requirement, tier, userRole, complianceStatus = 'pending', onUploadDocument }) => {
  const Icon = getCategoryIcon(requirement.category);
  const categoryColorClass = getCategoryColor(requirement.category);
  
  // SA/AD users should not upload documents themselves - they manage other users
  const canUpload = !['SA', 'AD'].includes(userRole);
  
  const getStatusIcon = () => {
    switch (complianceStatus) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'non_compliant': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'not_applicable': return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (complianceStatus) {
      case 'compliant': 
        return <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>;
      case 'warning': 
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Needs Attention</Badge>;
      case 'non_compliant': 
        return <Badge className="bg-red-100 text-red-800 border-red-200">Not Compliant</Badge>;
      case 'not_applicable': 
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">N/A</Badge>;
      default: 
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pending</Badge>;
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-gray-600" />
          <div>
            <h4 className="font-medium text-sm">{requirement.name}</h4>
            <p className="text-xs text-gray-600 mt-1">{requirement.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          {getStatusBadge()}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <Badge className={categoryColorClass}>
            {requirement.category.replace('_', ' ').toUpperCase()}
          </Badge>
          <span className="text-gray-500">Weight: {requirement.weight}%</span>
        </div>
        
        {requirement.measurement_type !== 'boolean' && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Target:</span> {
              typeof requirement.target_value === 'number' 
                ? `${requirement.target_value}${requirement.measurement_type === 'percentage' ? '%' : ''}`
                : String(requirement.target_value)
            }
          </div>
        )}

        {requirement.document_requirements && (
          <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
            <div className="font-medium text-gray-700">Document Requirements:</div>
            <ul className="space-y-1 text-gray-600">
              <li>• File types: {requirement.document_requirements.required_file_types.join(', ')}</li>
              <li>• Max size: {requirement.document_requirements.max_file_size_mb}MB</li>
              {requirement.document_requirements.requires_expiry_date && (
                <li>• Expiry date required</li>
              )}
            </ul>
            {canUpload && (
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUploadDocument?.(requirement.name, tier)}
                  className="h-7 text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload Document
                </Button>
              </div>
            )}
            {!canUpload && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 italic">
                  Upload managed through Verification Queue
                </p>
              </div>
            )}
          </div>
        )}

        {requirement.renewal_period_days && (
          <div className="text-xs text-orange-600">
            ⚠ Renewal required every {Math.round(requirement.renewal_period_days / 365)} year(s)
          </div>
        )}
      </div>
    </div>
  );
};

const TierColumn: React.FC<{
  template: RoleComplianceTemplate | null;
  tier: 'basic' | 'robust';
  userRole: string;
  isCurrentTier: boolean;
  userComplianceRecords?: any[];
  onUploadDocument?: (requirementName: string, tier: 'basic' | 'robust') => void;
  onTierSwitch?: (newTier: 'basic' | 'robust') => void;
}> = ({ 
  template, 
  tier, 
  userRole, 
  isCurrentTier, 
  userComplianceRecords = [], 
  onUploadDocument, 
  onTierSwitch 
}) => {
  if (!template) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg capitalize">{tier} Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No requirements template found for {userRole} - {tier}</p>
        </CardContent>
      </Card>
    );
  }

  const getComplianceStatus = (requirementName: string) => {
    const record = userComplianceRecords.find(r => 
      r.compliance_metrics?.name?.includes(requirementName) || 
      r.compliance_metrics?.name?.includes(`${requirementName} (${tier})`)
    );
    return record?.compliance_status || 'pending';
  };

  const completedCount = template.requirements.filter(req => 
    getComplianceStatus(req.name) === 'compliant'
  ).length;
  
  const completionPercentage = template.requirements.length > 0 
    ? Math.round((completedCount / template.requirements.length) * 100)
    : 0;

  return (
    <Card className={`h-fit ${isCurrentTier ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{template.role_name}</CardTitle>
          {isCurrentTier && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">Current</Badge>
          )}
        </div>
        <p className="text-sm text-gray-600">{template.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress: {completedCount}/{template.requirements.length}</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {!isCurrentTier && onTierSwitch && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onTierSwitch(tier)}
            className="w-full mt-2"
          >
            Switch to {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {template.requirements.map((requirement, index) => (
          <RequirementCard
            key={`${tier}-${index}`}
            requirement={requirement}
            tier={tier}
            userRole={userRole}
            complianceStatus={getComplianceStatus(requirement.name)}
            onUploadDocument={onUploadDocument}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export const TierRequirementsMatrix: React.FC<TierRequirementsMatrixProps> = ({
  userRole,
  currentTier,
  onUploadDocument,
  onTierSwitch,
  userComplianceRecords = [],
  className = ""
}) => {
  // For SA/AD admin users, get templates for ALL roles
  const allRoleTemplates = useMemo(() => {
    if (userRole === 'SA' || userRole === 'AD') {
      const allRoles: ('SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT')[] = ['SA', 'AD', 'AP', 'IC', 'IP', 'IT'];
      const roleTemplatesMap: Record<string, { basic: RoleComplianceTemplate | null; robust: RoleComplianceTemplate | null }> = {};
      
      allRoles.forEach(role => {
        try {
          // SA and AD roles don't have compliance requirements themselves
          if (role === 'SA' || role === 'AD') {
            roleTemplatesMap[role] = {
              basic: null,
              robust: null
            };
          } else {
            roleTemplatesMap[role] = ComplianceRequirementsService.getAllTemplatesForRole(role as 'AP' | 'IC' | 'IP' | 'IT');
          }
        } catch (error) {
          console.warn(`No templates found for role: ${role}`);
          roleTemplatesMap[role] = { basic: null, robust: null };
        }
      });
      
      return roleTemplatesMap;
    }
    return null;
  }, [userRole]);

  const templates = useMemo(() => {
    if (userRole === 'SA' || userRole === 'AD') {
      // For admin users, we'll handle this differently in the render
      return { basic: null, robust: null };
    }
    
    return ComplianceRequirementsService.getAllTemplatesForRole(userRole as 'AP' | 'IC' | 'IP' | 'IT');
  }, [userRole]);

  const [selectedComparison, setSelectedComparison] = useState<'side-by-side' | 'basic' | 'robust'>('side-by-side');
  const [selectedRole, setSelectedRole] = useState<'all' | 'AP' | 'IC' | 'IP' | 'IT'>('all');

  // Admin view for SA/AD users
  if (userRole === 'SA' || userRole === 'AD') {
    if (!allRoleTemplates) {
      return (
        <Card className={className}>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Loading role templates...</p>
          </CardContent>
        </Card>
      );
    }

    const availableRoles = Object.keys(allRoleTemplates).filter(role =>
      role !== 'SA' && role !== 'AD' && (
        allRoleTemplates[role]?.basic || allRoleTemplates[role]?.robust
      )
    ) as ('AP' | 'IC' | 'IP' | 'IT')[];

    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Admin Compliance Requirements Matrix</h2>
            <p className="text-gray-600 text-sm mt-1">
              View compliance requirements across all roles - {availableRoles.length} roles with requirements
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'all' | 'AP' | 'IC' | 'IP' | 'IT')}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Roles</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <Button
              size="sm"
              variant={selectedComparison === 'side-by-side' ? 'default' : 'outline'}
              onClick={() => setSelectedComparison('side-by-side')}
            >
              Side by Side
            </Button>
            <Button
              size="sm"
              variant={selectedComparison === 'basic' ? 'default' : 'outline'}
              onClick={() => setSelectedComparison('basic')}
            >
              Basic Only
            </Button>
            <Button
              size="sm"
              variant={selectedComparison === 'robust' ? 'default' : 'outline'}
              onClick={() => setSelectedComparison('robust')}
            >
              Robust Only
            </Button>
          </div>
        </div>

        {/* Role Status Summary */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-3">Role Coverage Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              {(['SA', 'AD', 'AP', 'IC', 'IP', 'IT'] as const).map(role => {
                const hasRequirements = allRoleTemplates[role]?.basic || allRoleTemplates[role]?.robust;
                return (
                  <div key={role} className="text-center">
                    <Badge
                      className={hasRequirements
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                      }
                    >
                      {role}
                    </Badge>
                    <p className="text-xs mt-1 text-blue-700">
                      {hasRequirements ? 'Has Requirements' : 'Admin/No Requirements'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Display selected role(s) */}
        {selectedRole === 'all' ? (
          <div className="space-y-8">
            {availableRoles.map(role => {
              const roleTemplates = allRoleTemplates[role];
              if (!roleTemplates || (!roleTemplates.basic && !roleTemplates.robust)) return null;
              
              return (
                <div key={role} className="space-y-4">
                  <div className="bg-gray-50 border-l-4 border-blue-500 p-4">
                    <h3 className="text-lg font-semibold text-gray-900">{role} Role Requirements</h3>
                  </div>
                  
                  {selectedComparison === 'side-by-side' && (
                    <div className="grid lg:grid-cols-2 gap-6">
                      {roleTemplates.basic && (
                        <TierColumn
                          template={roleTemplates.basic}
                          tier="basic"
                          userRole={role}
                          isCurrentTier={false}
                          userComplianceRecords={[]}
                          onUploadDocument={undefined}
                          onTierSwitch={undefined}
                        />
                      )}
                      {roleTemplates.robust && (
                        <TierColumn
                          template={roleTemplates.robust}
                          tier="robust"
                          userRole={role}
                          isCurrentTier={false}
                          userComplianceRecords={[]}
                          onUploadDocument={undefined}
                          onTierSwitch={undefined}
                        />
                      )}
                    </div>
                  )}
                  
                  {selectedComparison === 'basic' && roleTemplates.basic && (
                    <TierColumn
                      template={roleTemplates.basic}
                      tier="basic"
                      userRole={role}
                      isCurrentTier={false}
                      userComplianceRecords={[]}
                      onUploadDocument={undefined}
                      onTierSwitch={undefined}
                    />
                  )}
                  
                  {selectedComparison === 'robust' && roleTemplates.robust && (
                    <TierColumn
                      template={roleTemplates.robust}
                      tier="robust"
                      userRole={role}
                      isCurrentTier={false}
                      userComplianceRecords={[]}
                      onUploadDocument={undefined}
                      onTierSwitch={undefined}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Single role view
          (() => {
            const roleTemplates = allRoleTemplates[selectedRole];
            if (!roleTemplates || (!roleTemplates.basic && !roleTemplates.robust)) {
              return (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No requirements found for {selectedRole} role</p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="space-y-4">
                {selectedComparison === 'side-by-side' && (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {roleTemplates.basic && (
                      <TierColumn
                        template={roleTemplates.basic}
                        tier="basic"
                        userRole={selectedRole}
                        isCurrentTier={false}
                        userComplianceRecords={[]}
                        onUploadDocument={undefined}
                        onTierSwitch={undefined}
                      />
                    )}
                    {roleTemplates.robust && (
                      <TierColumn
                        template={roleTemplates.robust}
                        tier="robust"
                        userRole={selectedRole}
                        isCurrentTier={false}
                        userComplianceRecords={[]}
                        onUploadDocument={undefined}
                        onTierSwitch={undefined}
                      />
                    )}
                  </div>
                )}
                
                {selectedComparison === 'basic' && roleTemplates.basic && (
                  <TierColumn
                    template={roleTemplates.basic}
                    tier="basic"
                    userRole={selectedRole}
                    isCurrentTier={false}
                    userComplianceRecords={[]}
                    onUploadDocument={undefined}
                    onTierSwitch={undefined}
                  />
                )}
                
                {selectedComparison === 'robust' && roleTemplates.robust && (
                  <TierColumn
                    template={roleTemplates.robust}
                    tier="robust"
                    userRole={selectedRole}
                    isCurrentTier={false}
                    userComplianceRecords={[]}
                    onUploadDocument={undefined}
                    onTierSwitch={undefined}
                  />
                )}
              </div>
            );
          })()
        )}
      </div>
    );
  }

  // Regular user view
  if (!templates.basic && !templates.robust) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No compliance templates found for role: {userRole}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Compliance Requirements Matrix</h2>
          <p className="text-gray-600 text-sm mt-1">
            Compare Basic vs Robust tier requirements for {userRole} role
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={selectedComparison === 'side-by-side' ? 'default' : 'outline'}
            onClick={() => setSelectedComparison('side-by-side')}
          >
            Side by Side
          </Button>
          <Button
            size="sm"
            variant={selectedComparison === 'basic' ? 'default' : 'outline'}
            onClick={() => setSelectedComparison('basic')}
          >
            Basic Only
          </Button>
          <Button
            size="sm"
            variant={selectedComparison === 'robust' ? 'default' : 'outline'}
            onClick={() => setSelectedComparison('robust')}
          >
            Robust Only
          </Button>
        </div>
      </div>

      {selectedComparison === 'side-by-side' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <TierColumn
            template={templates.basic}
            tier="basic"
            userRole={userRole}
            isCurrentTier={currentTier === 'basic'}
            userComplianceRecords={userComplianceRecords}
            onUploadDocument={onUploadDocument}
            onTierSwitch={onTierSwitch}
          />
          <TierColumn
            template={templates.robust}
            tier="robust"
            userRole={userRole}
            isCurrentTier={currentTier === 'robust'}
            userComplianceRecords={userComplianceRecords}
            onUploadDocument={onUploadDocument}
            onTierSwitch={onTierSwitch}
          />
        </div>
      )}

      {selectedComparison === 'basic' && (
        <TierColumn
          template={templates.basic}
          tier="basic"
          userRole={userRole}
          isCurrentTier={currentTier === 'basic'}
          userComplianceRecords={userComplianceRecords}
          onUploadDocument={onUploadDocument}
          onTierSwitch={onTierSwitch}
        />
      )}

      {selectedComparison === 'robust' && (
        <TierColumn
          template={templates.robust}
          tier="robust"
          userRole={userRole}
          isCurrentTier={currentTier === 'robust'}
          userComplianceRecords={userComplianceRecords}
          onUploadDocument={onUploadDocument}
          onTierSwitch={onTierSwitch}
        />
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-blue-900">Understanding Tier Requirements</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Basic Tier:</strong> Essential onboarding requirements for immediate role functionality</p>
                <p><strong>Robust Tier:</strong> Comprehensive compliance including all basic requirements plus advanced certifications</p>
                <p><strong>Document Upload:</strong> Click the upload buttons to provide required documentation</p>
                <p><strong>Renewal:</strong> Some requirements need periodic renewal as indicated</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TierRequirementsMatrix;