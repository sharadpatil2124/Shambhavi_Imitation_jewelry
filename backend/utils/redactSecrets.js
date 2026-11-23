// Hides database credentials in text before it is logged or sent anywhere.
// Database drivers can copy parts of the connection settings (including the password) into the text of
// their own errors, so every error that may come from the driver goes through this first.

// Masks "user:password@" in any mysql:// or mysql2:// address.
const URI_CREDENTIALS = /(mysql2?:\/\/)[^@/\s'"]+@/gi;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const passwordFromUri = (uri) => {
  const match = /^[a-z0-9+]+:\/\/[^:@/]+:([^@/]+)@/i.exec(uri || '');
  return match ? match[1] : null;
};

// The MySQL password (MYSQL_PASSWORD, or the one inside MYSQL_URL), both as written and URL-decoded,
// so it is caught even when it appears on its own.
const secretsFromEnv = () => {
  const raw = [passwordFromUri(process.env.MYSQL_URL), process.env.MYSQL_PASSWORD].filter(Boolean);

  const all = [];
  for (const secret of raw) {
    all.push(secret);
    try { all.push(decodeURIComponent(secret)); } catch { /* keep the raw form */ }
  }
  return [...new Set(all)].filter((s) => s.length >= 4);
};

export const redactSecrets = (value) => {
  let text = String(value ?? '');
  text = text.replace(URI_CREDENTIALS, '$1***:***@');
  for (const secret of secretsFromEnv()) {
    text = text.replace(new RegExp(escapeRegExp(secret), 'g'), '***');
  }
  return text;
};

// Text of an error. Some errors carry no message of their own: when "localhost" resolves to both
// ::1 and 127.0.0.1, a refused connection arrives as an AggregateError holding one error per address.
const errorText = (err) => {
  if (!err || typeof err !== 'object') return err;
  if (err.message) return err.message;
  if (Array.isArray(err.errors) && err.errors.length) {
    return [...new Set(err.errors.map((e) => e?.message || e?.code).filter(Boolean))].join('; ');
  }
  return err.code || String(err);
};

// Safe one-line description of an error for logs.
export const safeErrorMessage = (err) => redactSecrets(errorText(err));
