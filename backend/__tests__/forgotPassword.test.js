import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import User from '../models/userModel.js';
import { forgotPassword, resendOtp } from '../controllers/userController.js';

// Clear every email provider setting so no real email can be sent from these tests.
const EMAIL_ENV_KEYS = [
  'BREVO_API_KEY', 'BREVO_SMTP_USER', 'BREVO_SMTP_PASSWORD', 'SMTP_USER', 'SMTP_PASS',
  'EMAIL_USER', 'EMAIL_PASS', 'GMAIL_USER', 'GMAIL_PASS'
];

const createRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

describe('Forgot password: account must exist before an OTP is generated', () => {
  const savedEnv = {};
  let origFindOne;
  let lookedUpEmails;

  before(() => {
    for (const key of EMAIL_ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });
  after(() => {
    for (const key of EMAIL_ENV_KEYS) {
      if (savedEnv[key] !== undefined) process.env[key] = savedEnv[key];
    }
  });

  beforeEach(() => {
    origFindOne = User.findOne;
    lookedUpEmails = [];
  });
  afterEach(() => {
    User.findOne = origFindOne;
  });

  it('returns 404 ACCOUNT_NOT_FOUND and generates no OTP when no account exists', async () => {
    User.findOne = async (filter) => { lookedUpEmails.push(filter.email); return null; };

    const res = createRes();
    let nextErr;
    await forgotPassword({ body: { email: 'nobody@example.com' } }, res, (e) => { nextErr = e; });

    assert.equal(nextErr, undefined);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'ACCOUNT_NOT_FOUND');
    assert.match(res.body.message, /create a new account/i);
    assert.deepEqual(lookedUpEmails, ['nobody@example.com']);
  });

  it('generates and saves a reset OTP when the account exists (email lookup is normalized)', async () => {
    let saved = false;
    const user = {
      email: 'customer@example.com',
      save: async () => { saved = true; }
    };
    User.findOne = async (filter) => { lookedUpEmails.push(filter.email); return user; };

    const res = createRes();
    let nextErr;
    await forgotPassword({ body: { email: '  Customer@Example.com ' } }, res, (e) => { nextErr = e; });

    assert.deepEqual(lookedUpEmails, ['customer@example.com']);
    assert.equal(saved, true);
    assert.match(user.resetPasswordOtp, /^\d{6}$/);
    assert.ok(user.resetPasswordOtpExpires > Date.now());
    assert.equal(user.resetPasswordOtpAttempts, 0);
    // No email provider is configured in tests, so delivery fails after the OTP is stored.
    assert.ok(nextErr instanceof Error);
  });

  it('rejects an invalid email with 400 before looking anything up', async () => {
    User.findOne = async (filter) => { lookedUpEmails.push(filter.email); return null; };

    const res = createRes();
    let nextErr;
    await forgotPassword({ body: { email: 'not-an-email' } }, res, (e) => { nextErr = e; });

    assert.equal(res.statusCode, 400);
    assert.ok(nextErr instanceof Error);
    assert.deepEqual(lookedUpEmails, []);
  });

  it('resend-otp (type=reset) also refuses emails with no account', async () => {
    User.findOne = async () => null;

    const res = createRes();
    await resendOtp({ body: { email: 'nobody@example.com', type: 'reset' } }, res, () => {});

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.code, 'ACCOUNT_NOT_FOUND');
  });
});
