// Hides MongoDB credentials in text before it is logged or sent anywhere.
// The MongoDB driver can copy parts of the connection string (including the password) into the text of
// its own errors (CVE-2026-129930), so every error that may come from the driver goes through this first.

// Masks "user:password@" in any mongodb:// or mongodb+srv:// address.
const URI_CREDENTIALS = /(mongodb(?:\+srv)?:\/\/)[^@/\s'"]+@/gi;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The password from MONGO_URI, both as written and URL-decoded, so it is caught even when it appears on its own.
const secretsFromEnv = () => {
  const match = /^mongodb(?:\+srv)?:\/\/[^:@/]+:([^@/]+)@/i.exec(process.env.MONGO_URI || '');
  if (!match) return [];
  const raw = match[1];
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch { /* keep the raw form */ }
  return [...new Set([raw, decoded])].filter((s) => s.length >= 4);
};

export const redactSecrets = (value) => {
  let text = String(value ?? '');
  text = text.replace(URI_CREDENTIALS, '$1***:***@');
  for (const secret of secretsFromEnv()) {
    text = text.replace(new RegExp(escapeRegExp(secret), 'g'), '***');
  }
  return text;
};

// Safe one-line description of an error for logs.
export const safeErrorMessage = (err) => redactSecrets(err?.message ?? err);
