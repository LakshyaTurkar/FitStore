import { useEffect } from 'react';

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | FitStore` : 'FitStore - Fuel Your Fitness Journey';
  }, [title]);
}
