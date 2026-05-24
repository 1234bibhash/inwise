import { useEffect, useLayoutEffect } from 'react';

export const useOnWindowResize = (handler: () => void) => {
  useLayoutEffect(() => {
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [handler]);
};
