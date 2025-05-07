
import React from 'react';

export function EmptyRequestsMessage() {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">No certificate requests found matching your criteria.</p>
    </div>
  );
}
