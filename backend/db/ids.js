import crypto from 'crypto';

// Record IDs are 24-character hex strings (4-byte timestamp, 5 random bytes, 3-byte counter).
// They are unique across servers without asking the database, roughly increase over time, and are the
// format the storefront and admin panel expect (short order numbers are the last 6 characters).
const PROCESS_UNIQUE = crypto.randomBytes(5);
let counter = crypto.randomInt(0, 0xffffff);

export const newId = () => {
  const buf = Buffer.alloc(12);
  buf.writeUInt32BE(Math.floor(Date.now() / 1000), 0);
  PROCESS_UNIQUE.copy(buf, 4);
  counter = (counter + 1) % 0x1000000;
  buf.writeUIntBE(counter, 9, 3);
  return buf.toString('hex');
};

const ID_FORMAT = /^[0-9a-fA-F]{24}$/;

export const isValidId = (value) => typeof value === 'string' && ID_FORMAT.test(value);
