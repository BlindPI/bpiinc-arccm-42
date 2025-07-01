
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StepPersonalInfoProps {
  recipientName: string;
  setRecipientName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  company: string;
  setCompany: (company: string) => void;
  city: string;
  setCity: (city: string) => void;
  province: string;
  setProvince: (province: string) => void;
  postalCode: string;
  setPostalCode: (postalCode: string) => void;
}

export function StepPersonalInfo({
  recipientName,
  setRecipientName,
  email,
  setEmail,
  phone,
  setPhone,
  company,
  setCompany,
  city,
  setCity,
  province,
  setProvince,
  postalCode,
  setPostalCode
}: StepPersonalInfoProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="recipientName" className="text-base">Recipient Name</Label>
        <Input
          id="recipientName"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          className="mt-1"
          placeholder="Full name of certificate recipient"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="email" className="text-base">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
          placeholder="Email address"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="phone" className="text-base">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1"
          placeholder="Phone number (optional)"
        />
      </div>
      
      <div>
        <Label htmlFor="company" className="text-base">Company / Organization</Label>
        <Input
          id="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="mt-1"
          placeholder="Company or organization (optional)"
        />
      </div>
      
      <div>
        <Label htmlFor="city" className="text-base">City</Label>
        <Input
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mt-1"
          placeholder="City (optional)"
        />
      </div>
      
      <div>
        <Label htmlFor="province" className="text-base">Province</Label>
        <Input
          id="province"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="mt-1"
          placeholder="Province (optional)"
        />
      </div>
      
      <div>
        <Label htmlFor="postalCode" className="text-base">Postal Code</Label>
        <Input
          id="postalCode"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          className="mt-1"
          placeholder="Postal Code (optional)"
        />
      </div>
    </div>
  );
}
