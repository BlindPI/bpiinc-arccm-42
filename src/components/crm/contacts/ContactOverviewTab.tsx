
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building, Calendar, User } from 'lucide-react';
import type { Contact } from '@/types/crm';

interface ContactOverviewTabProps {
  contact: Contact;
}

export function ContactOverviewTab({ contact }: ContactOverviewTabProps) {
  return (
    <div className="space-y-6">
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
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="mt-1">{contact.first_name} {contact.last_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <Badge className={contact.contact_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {contact.contact_status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <div className="mt-1 flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{contact.email}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <div className="mt-1 flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{contact.phone || 'Not provided'}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              <div className="mt-1 flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span>{contact.title || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Department</label>
              <p className="mt-1">{contact.department || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Preferred Contact Method</label>
              <p className="mt-1 capitalize">{contact.preferred_contact_method || 'Email'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Lead Source</label>
              <p className="mt-1 capitalize">{contact.lead_source || 'Direct'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {contact.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Contact Created</p>
                <p className="text-sm text-gray-500">{new Date(contact.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            {contact.converted_from_lead_id && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Converted from Lead</p>
                  <p className="text-sm text-gray-500">Conversion completed</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
