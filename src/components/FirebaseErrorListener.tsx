
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/lib/error-emitter';
import type { FirestorePermissionError } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error(error); // This will show the detailed error in the browser console.
      
      // We can also show a generic toast to the user.
      // The detailed error is what's important for debugging.
      toast({
        variant: "destructive",
        title: "Permission Error",
        description: "An operation was blocked by security rules. See console for details.",
        duration: 9000,
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null; // This component doesn't render anything.
}
