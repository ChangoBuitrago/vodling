import { useCallback, useRef } from 'react';
import { UI_CONFIG } from '../constants';

/**
 * Custom hook for optimized refetching with debouncing and smart retry logic
 */
export const useOptimizedRefetch = () => {
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefetchRef = useRef<number>(0);

  /**
   * Debounced refetch function that prevents excessive API calls
   */
  const debouncedRefetch = useCallback(
    (refetchFunctions: (() => Promise<any>)[], delay: number = 1000) => {
      // Clear existing timeout
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }

      // Set new timeout
      refetchTimeoutRef.current = setTimeout(async () => {
        const now = Date.now();
        
        // Prevent refetching too frequently (minimum 2 seconds between refetches)
        if (now - lastRefetchRef.current < 2000) {
          console.log('⏰ Skipping refetch - too frequent');
          return;
        }

        lastRefetchRef.current = now;
        
        try {
          console.log('🔄 Executing debounced refetch...');
          await Promise.all(refetchFunctions.map(fn => fn()));
          console.log('✅ Debounced refetch completed');
        } catch (error) {
          console.error('❌ Error during debounced refetch:', error);
        }
      }, delay);
    },
    []
  );

  /**
   * Smart refetch with exponential backoff for failed requests
   */
  const smartRefetch = useCallback(
    async (
      refetchFunctions: (() => Promise<any>)[],
      maxRetries: number = 3,
      baseDelay: number = 1000
    ) => {
      let retryCount = 0;
      
      const attemptRefetch = async (): Promise<void> => {
        try {
          console.log(`🔄 Smart refetch attempt ${retryCount + 1}/${maxRetries + 1}`);
          await Promise.all(refetchFunctions.map(fn => fn()));
          console.log('✅ Smart refetch successful');
          return;
        } catch (error) {
          retryCount++;
          
          if (retryCount <= maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
            console.log(`⏰ Smart refetch failed, retrying in ${delay}ms...`);
            
            setTimeout(() => {
              attemptRefetch();
            }, delay);
          } else {
            console.error('❌ Smart refetch failed after all retries:', error);
            throw error;
          }
        }
      };

      await attemptRefetch();
    },
    []
  );

  /**
   * Immediate refetch with fallback delay
   */
  const immediateRefetch = useCallback(
    async (refetchFunctions: (() => Promise<any>)[]) => {
      try {
        console.log('🚀 Immediate refetch...');
        await Promise.all(refetchFunctions.map(fn => fn()));
        console.log('✅ Immediate refetch completed');
      } catch (error) {
        console.error('❌ Immediate refetch failed:', error);
        
        // Fallback: try again after delay
        setTimeout(async () => {
          try {
            console.log('🔄 Fallback refetch...');
            await Promise.all(refetchFunctions.map(fn => fn()));
            console.log('✅ Fallback refetch completed');
          } catch (fallbackError) {
            console.error('❌ Fallback refetch also failed:', fallbackError);
          }
        }, UI_CONFIG.REFETCH_DELAY);
      }
    },
    []
  );

  /**
   * Cleanup function to clear timeouts
   */
  const cleanup = useCallback(() => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
      refetchTimeoutRef.current = null;
    }
  }, []);

  return {
    debouncedRefetch,
    smartRefetch,
    immediateRefetch,
    cleanup,
  };
};
