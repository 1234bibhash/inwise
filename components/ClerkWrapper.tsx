'use client';

import { ClerkProvider } from '@clerk/nextjs';

export function ClerkWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2xlcmstbW9jay1rZXktd2lsbC1iZS1yZXBsYWNlZC1ieS12ZXJjZWwtZW52'}>
      {children}
    </ClerkProvider>
  );
}
