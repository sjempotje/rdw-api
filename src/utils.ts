/**
 * Normalizes a Dutch license plate (kenteken) to uppercase without dashes
 * @param kenteken - The license plate string (with or without dashes)
 * @returns Normalized license plate in uppercase without dashes
 */
export function normalizeKenteken(kenteken: string): string {
  return kenteken.replace(/-/g, '').toUpperCase()
}

/**
 * Validates if a kenteken has a valid format
 * @param kenteken - The license plate string to validate
 * @returns True if valid format
 */
export function isValidKenteken(kenteken: string): boolean {
  const normalized = normalizeKenteken(kenteken)
  // Dutch license plates are typically 6 characters (can be letters and numbers)
  return /^[A-Z0-9]{4,8}$/.test(normalized)
}
