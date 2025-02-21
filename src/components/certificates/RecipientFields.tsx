
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RecipientFieldsProps {
  name: string;
  email: string;
  phone: string;
  company: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
}

export function RecipientFields({
  name,
  email,
  phone,
  company,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onCompanyChange
}: RecipientFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Recipient Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
          placeholder="Enter recipient's name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Enter recipient's email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="Enter recipient's phone"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={company}
          onChange={(e) => onCompanyChange(e.target.value)}
          placeholder="Enter recipient's company"
        />
      </div>
    </>
  );
}
