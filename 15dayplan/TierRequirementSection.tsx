// File: src/components/compliance/TierRequirementSection.tsx

import React, { useState } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from './components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from './components/ui/collapsible';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Progress } from './components/ui/progress';
import { 
  CheckCircle2, 
  CircleDashed, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Bookmark,
  GraduationCap,
  ClipboardCheck,
  AlertTriangle
} from 'lucide-react';
// Export the UIRequirement interface for use in other components
export interface UIRequirement {
  id: string;
  name: string;
  description: string;
  status: 'approved' | 'submitted' | 'rejected' | 'in_progress' | 'not_started';
  type: 'document' | 'certification' | 'training' | 'assessment' | string;
  progress: number;
  due_date?: string;
  display_config?: {
    priority?: 'high' | 'medium' | 'low';
  };
}

interface TierRequirementSectionProps {
  title: string;
  requirements: UIRequirement[];
  tier: 'basic' | 'robust';
  onRequirementClick?: (requirement: UIRequirement) => void;
}

export function TierRequirementSection({ 
  title, 
  requirements, 
  tier,
  onRequirementClick
}: TierRequirementSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Skip rendering if no requirements
  if (!requirements || requirements.length === 0) {
    return null;
  }
  
  // Calculate section progress
  const completedCount = requirements.filter(req => req.status === 'approved').length;
  const totalCount = requirements.length;
  const completionPercentage = totalCount > 0 
    ? Math.round((completedCount / totalCount) * 100) 
    : 0;
  
  // Get category icon based on title
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'certification': <GraduationCap className="h-5 w-5 text-purple-600" />,
      'documentation': <FileText className="h-5 w-5 text-blue-600" />,
      'training': <Bookmark className="h-5 w-5 text-green-600" />,
      'assessment': <ClipboardCheck className="h-5 w-5 text-amber-600" />
    };
    
    // Try to match category (case insensitive)
    const key = Object.keys(icons).find(k => 
      category.toLowerCase().includes(k.toLowerCase())
    );
    
    return key ? icons[key] : <CircleDashed className="h-5 w-5 text-gray-600" />;
  };
  
  // Get tier specific styling
  const getTierStyles = (tier: 'basic' | 'robust') => {
    if (tier === 'basic') {
      return {
        borderColor: 'border-blue-200',
        headerBg: 'bg-blue-50',
        iconColor: 'text-blue-600'
      };
    } else {
      return {
        borderColor: 'border-purple-200',
        headerBg: 'bg-purple-50',
        iconColor: 'text-purple-600'
      };
    }
  };
  
  const styles = getTierStyles(tier);
  
  return (
    <Card className={`border-2 ${styles.borderColor} shadow-sm`}>
      <CardHeader className={`${styles.headerBg} pb-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(title)}
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant={tier === 'basic' ? 'default' : 'secondary'} className="ml-2">
              {requirements.length}
            </Badge>
          </div>
          
          <CollapsibleTrigger asChild onClick={() => setIsExpanded(!isExpanded)}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CardDescription>
          {completedCount} of {totalCount} requirements completed
        </CardDescription>
        
        <Progress 
          value={completionPercentage} 
          className="h-1.5 mt-2" 
        />
      </CardHeader>
      
      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {requirements.map(requirement => (
                <RequirementCard 
                  key={requirement.id}
                  requirement={requirement}
                  tier={tier}
                  onClick={() => onRequirementClick?.(requirement)}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
      
      <CardFooter className="py-3 flex justify-between bg-gray-50">
        <div className="flex items-center text-sm text-muted-foreground">
          <span>{completionPercentage}% complete</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          className="text-sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide' : 'Show'} requirements
        </Button>
      </CardFooter>
    </Card>
  );
}

interface RequirementCardProps {
  requirement: UIRequirement;
  tier: 'basic' | 'robust';
  onClick?: () => void;
}

function RequirementCard({ requirement, tier, onClick }: RequirementCardProps) {
  // Determine status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'submitted':
        return <CircleDashed className="h-5 w-5 text-blue-600" />;
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'in_progress':
        return <CircleDashed className="h-5 w-5 text-amber-600" />;
      default:
        return <CircleDashed className="h-5 w-5 text-gray-400" />;
    }
  };
  
  // Get type icon based on requirement type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'certification':
        return <GraduationCap className="h-4 w-4" />;
      case 'training':
        return <Bookmark className="h-4 w-4" />;
      case 'assessment':
        return <ClipboardCheck className="h-4 w-4" />;
      default:
        return <CircleDashed className="h-4 w-4" />;
    }
  };
  
  const statusIcon = getStatusIcon(requirement.status);
  const typeIcon = getTypeIcon(requirement.type);
  const isMandatory = requirement.display_config?.priority === 'high';
  
  // Tier-specific styles
  const cardClasses = tier === 'robust' 
    ? 'hover:bg-purple-50 border-l-4 border-l-purple-300' 
    : 'hover:bg-blue-50 border-l-4 border-l-blue-300';

  return (
    <div 
      className={`p-3 bg-white rounded-md border ${cardClasses} cursor-pointer transition-colors`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{statusIcon}</div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{requirement.name}</h4>
            
            {isMandatory && (
              <Badge variant="outline" className="text-xs">Required</Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {requirement.description}
          </p>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {typeIcon}
              <span>{requirement.type}</span>
            </div>
            
            {requirement.due_date && (
              <div className="text-xs text-muted-foreground">
                Due: {new Date(requirement.due_date).toLocaleDateString()}
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Progress 
                value={requirement.progress} 
                className="h-1.5 w-16" 
              />
              <span className="text-xs">{requirement.progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}