// File: src/components/compliance/TierBenefitsOverview.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Award, 
  Clock, 
  FileCheck, 
  ShieldCheck, 
  Users, 
  BarChart, 
  Calendar, 
  BookOpen,
  Layers,
  Zap,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

interface TierBenefitsOverviewProps {
  tier?: 'basic' | 'robust';
  role?: string;
  onTierChange?: (tier: 'basic' | 'robust') => void;
}

export function TierBenefitsOverview({ 
  tier = 'basic', 
  role = 'IT',
  onTierChange
}: TierBenefitsOverviewProps) {
  // Get role-specific tier benefits
  const benefits = getTierBenefits(tier, role);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {tier === 'basic' ? 'Essential' : 'Comprehensive'} Tier Benefits
            </CardTitle>
            <CardDescription>
              {tier === 'basic' 
                ? 'Core requirements designed for basic compliance' 
                : 'Enhanced features for advanced compliance management'}
            </CardDescription>
          </div>
          
          <Badge variant={tier === 'basic' ? 'default' : 'secondary'}>
            {getRoleLabel(role)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={tier} onValueChange={(value) => onTierChange?.(value as 'basic' | 'robust')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Essential Tier</TabsTrigger>
            <TabsTrigger value="robust">Comprehensive Tier</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getTierBenefits('basic', role).map((benefit, i) => (
                <BenefitCard 
                  key={i}
                  icon={benefit.icon}
                  title={benefit.title}
                  description={benefit.description}
                  tier="basic"
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="robust" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getTierBenefits('robust', role).map((benefit, i) => (
                <BenefitCard 
                  key={i}
                  icon={benefit.icon}
                  title={benefit.title}
                  description={benefit.description}
                  tier="robust"
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {tier === 'basic' && (
          <div className="mt-6 pt-4 border-t flex justify-end">
            <Button 
              variant="default" 
              onClick={() => onTierChange?.('robust')}
              className="gap-2"
            >
              <Award className="h-4 w-4" />
              Upgrade to Comprehensive
            </Button>
          </div>
        )}
        
        {tier === 'robust' && (
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">You're on the Comprehensive Tier</h4>
                <p className="text-sm text-purple-700 mt-1">
                  You have access to all advanced features and enhanced compliance tools
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tier: 'basic' | 'robust';
}

function BenefitCard({ icon, title, description, tier }: BenefitCardProps) {
  const bgColor = tier === 'basic' ? 'bg-blue-50' : 'bg-purple-50';
  const borderColor = tier === 'basic' ? 'border-blue-200' : 'border-purple-200';
  const textColor = tier === 'basic' ? 'text-blue-900' : 'text-purple-900';
  const descColor = tier === 'basic' ? 'text-blue-700' : 'text-purple-700';
  
  return (
    <div className={`p-4 ${bgColor} border ${borderColor} rounded-md`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <h4 className={`font-medium ${textColor}`}>{title}</h4>
          <p className={`text-sm ${descColor} mt-1`}>{description}</p>
        </div>
      </div>
    </div>
  );
}

// Helper function to get role-specific tier benefits
function getTierBenefits(tier: 'basic' | 'robust', role: string) {
  const iconColor = tier === 'basic' ? 'text-blue-600' : 'text-purple-600';
  
  // Basic tier benefits (common across roles)
  const basicBenefits = [
    {
      icon: <FileCheck className={`h-5 w-5 ${iconColor}`} />,
      title: 'Essential Requirements',
      description: 'Core requirements necessary for basic compliance'
    },
    {
      icon: <Clock className={`h-5 w-5 ${iconColor}`} />,
      title: 'Streamlined Process',
      description: 'Simplified workflow with focused requirements'
    },
    {
      icon: <BarChart className={`h-5 w-5 ${iconColor}`} />,
      title: 'Basic Analytics',
      description: 'Standard progress tracking and reporting'
    },
    {
      icon: <Calendar className={`h-5 w-5 ${iconColor}`} />,
      title: 'Standard Timeline',
      description: 'Complete requirements in 2-4 weeks'
    }
  ];
  
  // Robust tier benefits (common across roles)
  const robustBenefits = [
    {
      icon: <Layers className={`h-5 w-5 ${iconColor}`} />,
      title: 'Comprehensive Requirements',
      description: 'Advanced requirements for thorough compliance'
    },
    {
      icon: <ShieldCheck className={`h-5 w-5 ${iconColor}`} />,
      title: 'Enhanced Protection',
      description: 'Higher level of compliance coverage'
    },
    {
      icon: <Users className={`h-5 w-5 ${iconColor}`} />,
      title: 'Mentoring Support',
      description: 'Access to mentoring and guidance'
    },
    {
      icon: <BarChart className={`h-5 w-5 ${iconColor}`} />,
      title: 'Advanced Analytics',
      description: 'Detailed metrics and performance insights'
    }
  ];
  
  // Role-specific benefits
  const roleSpecificBenefits = {
    IT: {
      basic: [
        {
          icon: <BookOpen className={`h-5 w-5 ${iconColor}`} />,
          title: 'Basic Training Materials',
          description: 'Access to standard training resources'
        }
      ],
      robust: [
        {
          icon: <GraduationCap className={`h-5 w-5 ${iconColor}`} />,
          title: 'Advanced Teaching Skills',
          description: 'Develop comprehensive teaching methodology'
        }
      ]
    },
    IP: {
      basic: [
        {
          icon: <BookOpen className={`h-5 w-5 ${iconColor}`} />,
          title: 'Provisional Certification',
          description: 'Requirements for provisional teaching status'
        }
      ],
      robust: [
        {
          icon: <Zap className={`h-5 w-5 ${iconColor}`} />,
          title: 'Advanced Teaching Portfolio',
          description: 'Build a comprehensive teaching portfolio'
        }
      ]
    },
    IC: {
      basic: [
        {
          icon: <Award className={`h-5 w-5 ${iconColor}`} />,
          title: 'Certification Maintenance',
          description: 'Maintain your instructor certification'
        }
      ],
      robust: [
        {
          icon: <GraduationCap className={`h-5 w-5 ${iconColor}`} />,
          title: 'Master Instructor Path',
          description: 'Path to becoming a master instructor'
        }
      ]
    },
    AP: {
      basic: [
        {
          icon: <ShieldCheck className={`h-5 w-5 ${iconColor}`} />,
          title: 'Provider Certification',
          description: 'Essential provider requirements'
        }
      ],
      robust: [
        {
          icon: <Users className={`h-5 w-5 ${iconColor}`} />,
          title: 'Instructor Development',
          description: 'Tools to develop your instructor team'
        }
      ]
    }
  };
  
  const roleBenefits = roleSpecificBenefits[role as keyof typeof roleSpecificBenefits] || { basic: [], robust: [] };
  
  return tier === 'basic' 
    ? [...basicBenefits, ...roleBenefits.basic]
    : [...robustBenefits, ...roleBenefits.robust];
}

// Helper function to get full role label
function getRoleLabel(roleCode: string) {
  const roles = {
    'IT': 'Instructor Trainee',
    'IP': 'Instructor Provisional',
    'IC': 'Instructor Certified',
    'AP': 'Authorized Provider'
  };
  return roles[roleCode as keyof typeof roles] || roleCode;
}