
import { Shield, Lock, CheckCircle, Info, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const CERTIFICATIONS = [
  {
    icon: Shield,
    label: 'Enterprise Security',
    description: 'Our platform adheres to enterprise-grade security standards, including advanced encryption, regular security audits, and compliance with industry best practices.',
  },
  {
    icon: Lock,
    label: 'ISO 27001',
    description: 'ISO 27001 certified, demonstrating our commitment to information security management and protecting your data through internationally recognized standards.',
  },
  {
    icon: CheckCircle,
    label: 'SOC 2',
    description: 'SOC 2 Type II compliant, verifying our systems are designed to keep your data secure with regular third-party audits of our security controls.',
  },
];

const HELP_TOPICS = [
  {
    title: 'Common Sign-in Issues',
    content: 'If you're having trouble signing in, check if: your caps lock is on, you're using the correct email, or try resetting your password.',
  },
  {
    title: 'Account Security',
    content: 'We use industry-leading security measures including 2FA, encrypted data storage, and regular security audits to protect your account.',
  },
  {
    title: 'SSO Authentication',
    content: 'Single Sign-On (SSO) allows you to use your existing Google or GitHub account credentials to access our platform securely.',
  },
];

export const SecurityBadges = () => {
  return (
    <div className="space-y-6">
      <TooltipProvider>
        <div className="flex justify-center gap-4 py-4">
          {CERTIFICATIONS.map(({ icon: Icon, label, description }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm text-gray-600 cursor-help">
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      <div className="flex justify-center">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
              <HelpCircle className="h-4 w-4" />
              <span>Need help signing in?</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Info className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Authentication Help</h4>
              </div>
              {HELP_TOPICS.map(({ title, content }) => (
                <div key={title} className="space-y-2">
                  <h5 className="font-medium text-sm">{title}</h5>
                  <p className="text-sm text-gray-600">{content}</p>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
