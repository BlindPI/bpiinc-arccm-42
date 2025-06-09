
import React from 'react';
import LocationTable from '@/components/LocationTable';

export default function Locations() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Locations Management</h1>
      <LocationTable />
    </div>
  );
}
