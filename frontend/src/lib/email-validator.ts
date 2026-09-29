// Gmail-only email validation for Elite Tamil Matrimony
// Strictly enforces @gmail.com domain while ensuring proper username format.

/**
 * Validates whether an email is a valid Gmail address (ending strictly in @gmail.com).
 * Rejects all non-Gmail domains, misspellings (e.g., @gamil.com, @gmail.co, @gmail.in),
 * and structurally invalid addresses.
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Please enter a valid Gmail address." };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic length check (shortest valid is a@gmail.com which is 11 chars)
  if (trimmed.length < 11 || trimmed.length > 254) {
    return { valid: false, error: "Please enter a valid Gmail address." };
  }

  // Must have exactly one '@'
  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { valid: false, error: "Please enter a valid Gmail address." };
  }

  const [username, domain] = parts;

  // Domain must be EXACTLY "gmail.com" (case-insensitive)
  if (domain !== "gmail.com") {
    return { valid: false, error: "Please enter a valid Gmail address." };
  }

  // Validate Gmail username
  if (!username || username.length < 1 || username.length > 64) {
    return { valid: false, error: "Please enter a valid Gmail address." };
  }

  // Cannot start or end with a dot, or contain consecutive dots
  if (username.startsWith(".") || username.endsWith(".") || username.includes("..")) {
    return { valid: false, error: "Please enter a valid Gmail address." };
  }

  // Gmail usernames consist of letters, numbers, and periods
  const usernameRe = /^[a-zA-Z0-9.]+$/;
  if (!usernameRe.test(username)) {
    return { valid: false, error: "Please enter a valid Gmail address." };
  }

  return { valid: true };
}

/**
 * Boolean helper for convenience.
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).valid;
}
