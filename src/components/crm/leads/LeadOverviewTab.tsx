
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Calendar,
  Star,
  DollarSign,
  Users
} from 'lucide-react';

interface LeadOverviewTabProps {
  lead: any;
}

export function LeadOverviewTab({ lead }: LeadOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">First Name</label>
              <p className="text-sm text-gray-900">{lead.first_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Last Name</label>
              <p className="text-sm text-gray-900">{lead.last_name}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-900">{lead.email}</p>
            </div>
          </div>
          
          {lead.phone && (
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900">{lead.phone}</p>
              </div>
            </div>
          )}
          
          {lead.job_title && (
            <div>
              <label className="text-sm font-medium text-gray-600">Job Title</label>
              <p className="text-sm text-gray-900">{lead.job_title}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lead.company_name && (
            <div>
              <label className="text-sm font-medium text-gray-600">Company Name</label>
              <p className="text-sm text-gray-900">{lead.company_name}</p>
            </div>
          )}
          
          {lead.industry && (
            <div>
              <label className="text-sm font-medium text-gray-600">Industry</label>
              <p className="text-sm text-gray-900">{lead.industry}</p>
            </div>
          )}
          
          {lead.company_size && (
            <div>
              <label className="text-sm font-medium text-gray-600">Company Size</label>
              <div className="flex items-center gap-2 mt-1">
                <Users className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900">{lead.company_size}</p>
              </div>
            </div>
          )}
          
          {lead.website && (
            <div>
              <label className="text-sm font-medium text-gray-600">Website</label>
              <div className="flex items-center gap-2 mt-1">
                <Globe className="h-4 w-4 text-gray-400" />
                <a 
                  href={lead.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {lead.website}
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Qualification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Lead Qualification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Lead Score</label>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${lead.lead_score}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{lead.lead_score}/100</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Source</label>
              <p className="text-sm text-gray-900 capitalize">{lead.lead_source}</p>
            </div>
          </div>
          
          {lead.training_urgency && (
            <div>
              <label className="text-sm font-medium text-gray-600">Training Urgency</label>
              <Badge variant="outline" className="mt-1">
                {lead.training_urgency}
              </Badge>
            </div>
          )}
          
          {lead.estimated_participant_count && (
            <div>
              <label className="text-sm font-medium text-gray-600">Estimated Participants</label>
              <p className="text-sm text-gray-900">{lead.estimated_participant_count}</p>
            </div>
          )}
          
          {lead.budget_range && (
            <div>
              <label className="text-sm font-medium text-gray-600">Budget Range</label>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900">{lead.budget_range}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Created</label>
            <p className="text-sm text-gray-900">
              {new Date(lead.created_at).toLocaleDateString()}
            </p>
          </div>
          
          {lead.last_contact_date && (
            <div>
              <label className="text-sm font-medium text-gray-600">Last Contact</label>
              <p className="text-sm text-gray-900">
                {new Date(lead.last_contact_date).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {lead.decision_timeline && (
            <div>
              <label className="text-sm font-medium text-gray-600">Decision Timeline</label>
              <p className="text-sm text-gray-900">{lead.decision_timeline}</p>
            </div>
          )}
          
          {lead.conversion_date && (
            <div>
              <label className="text-sm font-medium text-gray-600">Converted</label>
              <p className="text-sm text-gray-900">
                {new Date(lead.conversion_date).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
