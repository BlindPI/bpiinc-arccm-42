
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone, Building } from 'lucide-react';

interface StepPersonalInfoProps {
  recipientName: string;
  email: string;
  phone: string;
  company: string;
  setRecipientName: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
  setCompany: (v: string) => void;
}

export function StepPersonalInfo({
  recipientName,
  email,
  phone,
  company,
  setRecipientName,
  setEmail,
  setPhone,
  setCompany
}: StepPersonalInfoProps) {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Personal Information
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Provide the certificate recipient's details below.
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName" className="flex items-center gap-1">
            <User className="h-4 w-4 text-muted-foreground" />
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            value={recipientName}
            onChange={e => setRecipientName(e.target.value)}
            placeholder="John Doe"
            autoComplete="off"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="flex items-center gap-1">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="john@example.com"
            autoComplete="off"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone" className="flex items-center gap-1">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="company" className="flex items-center gap-1">
            <Building className="h-4 w-4 text-muted-foreground" />
            Company/Organization
          </Label>
          <Input
            id="company"
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Acme Inc."
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
