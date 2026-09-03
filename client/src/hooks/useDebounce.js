import { useState, useEffect } from 'react';

/**
 * Belirtilen değerin güncellenmesini geciktiren custom hook.
 * @param {any} value - Takip edilecek değer (örn: search input string)
 * @param {number} delay - Milisaniye cinsinden gecikme süresi (varsayılan: 500ms)
 * @returns {any} Geciktirilmiş değer
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Belirtilen süre sonunda değeri güncelle
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Kullanıcı süre dolmadan tekrar yazarsa önceki zamanlayıcıyı iptal et
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;