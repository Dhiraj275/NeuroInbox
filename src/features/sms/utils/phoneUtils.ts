/**
 * Formats raw phone numbers returned by SMS APIs into a unified standard format (e.g., +91XXXXXXXXXX).
 * Preserves alphanumeric sender IDs/headers (e.g., "AD-HDFCBK").
 *
 * @param rawAddress - The phone number or sender ID string
 * @returns Standardized phone number or original header
 */
export const formatPhoneNumber = (rawAddress: string): string => {
  if (!rawAddress) return '';

  const trimmed = rawAddress.trim();

  // Preserve alphanumeric sender headers (e.g., AD-HDFCBK, AX-INDUSB, VM-PAYTM)
  if (/[a-zA-Z]/.test(trimmed)) {
    return trimmed;
  }

  // Remove non-digit characters except a leading +
  const cleanDigits = trimmed.replace(/[^\d+]/g, '');

  // Extract pure digits
  const pureDigits = cleanDigits.replace(/\+/g, '');

  // Indian 10-digit number format (+91XXXXXXXXXX)
  if (pureDigits.length === 10) {
    return `+91${pureDigits}`;
  }

  // 11-digit starting with 0 (e.g., 09876543210) -> +919876543210
  if (pureDigits.length === 11 && pureDigits.startsWith('0')) {
    return `+91${pureDigits.slice(1)}`;
  }

  // 12-digit starting with 91 (e.g., 919876543210) -> +919876543210
  if (pureDigits.length === 12 && pureDigits.startsWith('91')) {
    return `+91${pureDigits.slice(2)}`;
  }

  // If it already had a leading +, keep + with pure digits (e.g., +12025550123)
  if (cleanDigits.startsWith('+')) {
    return `+${pureDigits}`;
  }

  // Short numeric codes (e.g., 56161, 1901)
  if (pureDigits.length < 10) {
    return pureDigits;
  }

  // Default fallback for long digits without +
  return `+${pureDigits}`;
};
