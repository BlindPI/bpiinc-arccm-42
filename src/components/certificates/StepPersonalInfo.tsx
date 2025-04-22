
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface StepPersonalInfoProps {
  name: string;
  email: string;
  phone: string;
  company: string;
  setName: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
  setCompany: (v: string) => void;
}

export function StepPersonalInfo({
  name,
  email,
  phone,
  company,
  setName,
  setEmail,
  setPhone,
  setCompany
}: StepPersonalInfoProps) {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="section-header">Personal Information</h2>
        <p className="text-muted-foreground text-sm">Provide the certificate recipient’s details below.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="John Doe"
            autoComplete="off"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email Address</Label>
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
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            autoComplete="off"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="company">Company/Organization</Label>
          <Input
            id="company"
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Acme Inc."
            autoComplete="off"
            required
          />
        </div>
      </div>
    </div>
  );
}
