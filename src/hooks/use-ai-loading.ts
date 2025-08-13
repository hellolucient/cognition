import { useState, useEffect } from "react";

export function useAILoading(initialLoading = false, delay = 1500) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [shouldShowModal, setShouldShowModal] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      timer = setTimeout(() => {
        setShouldShowModal(true);
      }, delay);
    } else {
      setShouldShowModal(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, delay]);

  return {
    isLoading,
    setIsLoading,
    shouldShowModal
  };
}
