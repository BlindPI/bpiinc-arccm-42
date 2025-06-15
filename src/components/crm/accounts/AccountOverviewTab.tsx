
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Globe, Phone, MapPin, DollarSign, Users, Calendar } from 'lucide-react';
import type { Account } from '@/types/crm';

interface AccountOverviewTabProps {
  account: Account;
}

export function AccountOverviewTab({ account }: AccountOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Account Name</label>
              <p className="mt-1 font-medium">{account.account_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Account Type</label>
              <div className="mt-1">
                <Badge className={
                  account.account_type === 'customer' ? 'bg-blue-100 text-blue-800' :
                  account.account_type === 'prospect' ? 'bg-yellow-100 text-yellow-800' :
                  account.account_type === 'partner' ? 'bg-purple-100 text-purple-800' :
                  'bg-red-100 text-red-800'
                }>
                  {account.account_type}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <Badge className={account.account_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {account.account_status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Industry</label>
              <p className="mt-1">{account.industry || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Company Size</label>
              <div className="mt-1 flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span>{account.company_size || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Annual Revenue</label>
              <div className="mt-1 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span>{account.annual_revenue ? `$${account.annual_revenue.toLocaleString()}` : 'Not specified'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Website</label>
              <div className="mt-1 flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                {account.website ? (
                  <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {account.website}
                  </a>
                ) : (
                  <span>Not provided</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <div className="mt-1 flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{account.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      {(account.billing_address || account.billing_city) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Billing Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {account.billing_address && <p>{account.billing_address}</p>}
              <p>
                {[account.billing_city, account.billing_state, account.billing_postal_code]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {account.billing_country && <p>{account.billing_country}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {account.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{account.notes}</p>
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
                <p className="font-medium">Account Created</p>
                <p className="text-sm text-gray-500">{new Date(account.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            {account.converted_from_lead_id && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Converted from Lead</p>
                  <p className="text-sm text-gray-500">
                    {account.lead_conversion_date ? new Date(account.lead_conversion_date).toLocaleDateString() : 'Date not available'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
