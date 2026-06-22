export function getContrastingTextColor(hexColor: string) {
    // Remove leading hash if present
    let cleanHex = hexColor.replace(/^#/, '');

    // Convert 3-digit hex to 6-digit hex
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(char => char + char).join('');
    }

    // Parse r, g, b values
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    // Calculate YIQ brightness ratio (weights human eye color perception)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Midpoint is 128. Greater means bright background (needs black text)
    return yiq >= 128 ? '#000000' : '#FFFFFF';
  };

  export function generateSafeUUID(): string {
  // 1. Try to use the native browser crypto API first (if available)
  if (
    typeof window !== 'undefined' && 
    window.crypto && 
    typeof window.crypto.randomUUID === 'function'
  ) {
    return window.crypto.randomUUID();
  }

  // 2. Fallback: Math-based UUID generator for insecure local IP testing (Safari/iOS HTTP)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}