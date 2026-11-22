import nodemailer from 'nodemailer';

const getVerifyEmailHtml = (otp) => `
<div style="background-color: #faf9f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center; color: #121212;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2d7bd; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 30px; border-bottom: 1px solid #f1ebd9; padding-bottom: 20px;">
      <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.3em; color: #bca054; text-transform: uppercase; display: block; margin-bottom: 5px;">SHAMBHAVI IMITATION</span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #121212; margin: 0;">Verify Your Email Address</h2>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 30px; text-align: center;">
      Thank you for creating an account with Shambhavi Imitation. To complete your registration and secure your profile, please use the 6-digit verification code below:
    </p>
    <div style="background-color: #faf8f2; border: 1px dashed #bca054; display: inline-block; padding: 15px 40px; font-size: 32px; font-weight: bold; letter-spacing: 0.25em; color: #121212; margin-bottom: 30px; font-family: monospace;">
      ${otp}
    </div>
    <p style="font-size: 12px; color: #777777; margin-bottom: 30px; text-align: center;">
      This code is valid for <strong>10 minutes</strong>. If you did not request this code, please ignore this email.
    </p>
    <div style="border-top: 1px solid #f1ebd9; padding-top: 25px; font-size: 11px; color: #888888; line-height: 1.4; text-align: center;">
      <p style="margin: 0 0 5px 0;">Shambhavi Imitation Jewelry</p>
      <p style="margin: 0;">Crafted with Elegance & Luxury</p>
    </div>
  </div>
</div>
`;

const getResetEmailHtml = (otp) => `
<div style="background-color: #faf9f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center; color: #121212;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2d7bd; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 30px; border-bottom: 1px solid #f1ebd9; padding-bottom: 20px;">
      <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.3em; color: #bca054; text-transform: uppercase; display: block; margin-bottom: 5px;">SHAMBHAVI IMITATION</span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #121212; margin: 0;">Reset Your Password</h2>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 30px; text-align: center;">
      We received a request to reset the password associated with your account. Please use the 6-digit OTP verification code below to authorize this change:
    </p>
    <div style="background-color: #faf8f2; border: 1px dashed #bca054; display: inline-block; padding: 15px 40px; font-size: 32px; font-weight: bold; letter-spacing: 0.25em; color: #121212; margin-bottom: 30px; font-family: monospace;">
      ${otp}
    </div>
    <p style="font-size: 12px; color: #777777; margin-bottom: 30px; text-align: center;">
      This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please secure your account immediately or contact support.
    </p>
    <div style="border-top: 1px solid #f1ebd9; padding-top: 25px; font-size: 11px; color: #888888; line-height: 1.4; text-align: center;">
      <p style="margin: 0 0 5px 0;">Shambhavi Imitation Jewelry</p>
      <p style="margin: 0;">Crafted with Elegance & Luxury</p>
    </div>
  </div>
</div>
`;

// Shown to customers. Provider details (IPs, SMTP codes) stay in the server logs.
const USER_FACING_EMAIL_ERROR = 'We could not send the email right now. Please try again in a few minutes or contact support.';
const BREVO_AUTHORIZED_IPS_URL = 'https://app.brevo.com/security/authorised_ips';

const clean = (val) => (val ? String(val).replace(/^['"]|['"]$/g, '').trim() : '');

const getEmailConfig = () => {
  const smtpUser = clean(process.env.BREVO_SMTP_USER || process.env.SMTP_USER || process.env.EMAIL_USER);
  const gmailUser = clean(process.env.GMAIL_USER);

  return {
    apiKey: clean(process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY),
    smtp: {
      host: clean(process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || process.env.EMAIL_HOST) || 'smtp-relay.brevo.com',
      port: parseInt(clean(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || process.env.EMAIL_PORT) || '587', 10),
      user: smtpUser,
      pass: clean(process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS),
    },
    gmail: {
      user: gmailUser,
      pass: clean(process.env.GMAIL_PASS).replace(/\s+/g, ''),
    },
    fromEmail: clean(process.env.BREVO_EMAIL_FROM || process.env.EMAIL_FROM) || gmailUser || smtpUser || 'kadamshambhavi1@gmail.com',
    fromName: clean(process.env.BREVO_EMAIL_FROM_NAME || process.env.EMAIL_FROM_NAME) || 'Shambhavi Imitation',
  };
};

const SMTP_TIMEOUTS = { connectionTimeout: 10000, greetingTimeout: 8000, socketTimeout: 15000 };

const createTransporter = ({ host, port, user, pass }) => {
  const isGmail = host.toLowerCase().includes('gmail') || user.toLowerCase().endsWith('@gmail.com') || process.env.EMAIL_SERVICE === 'gmail';

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: pass.replace(/\s+/g, '') },
      ...SMTP_TIMEOUTS,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    ...SMTP_TIMEOUTS,
    tls: { rejectUnauthorized: false },
  });
};

// Brevo transactional API over HTTPS (port 443), which Render's free tier never blocks.
const sendViaBrevoApi = async ({ apiKey, fromName, fromEmail }, { to, subject, html }) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.message || `Brevo API responded with HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return { messageId: data.messageId };
};

const sendViaSmtp = async (transportConfig, from, { to, subject, html }) =>
  createTransporter(transportConfig).sendMail({ from, to, subject, html });

// Every configured provider, in priority order. The next one is tried if the previous fails.
const buildProviders = (cfg) => {
  const providers = [];

  if (cfg.apiKey) {
    providers.push({ name: 'Brevo HTTPS API', kind: 'api', send: (msg) => sendViaBrevoApi(cfg, msg) });
  }
  if (cfg.smtp.user && cfg.smtp.pass) {
    providers.push({
      name: `SMTP ${cfg.smtp.host}:${cfg.smtp.port}`,
      kind: 'smtp',
      send: (msg) => sendViaSmtp(cfg.smtp, `"${cfg.fromName}" <${cfg.fromEmail}>`, msg),
    });
  }
  if (cfg.gmail.user && cfg.gmail.pass && cfg.gmail.user !== cfg.smtp.user) {
    providers.push({
      name: 'Gmail SMTP',
      kind: 'smtp',
      // Gmail only sends as the authenticated account (or its verified aliases).
      send: (msg) => sendViaSmtp(
        { host: 'smtp.gmail.com', port: 465, user: cfg.gmail.user, pass: cfg.gmail.pass },
        `"${cfg.fromName}" <${cfg.gmail.user}>`,
        msg
      ),
    });
  }

  return providers;
};

// Turns provider errors into an actionable fix for the server logs.
const diagnoseEmailError = (err, kind) => {
  const text = `${err.message || ''} ${err.response || ''}`;

  if (err.responseCode === 525 || /unauthori[sz]ed ip|unrecogni[sz]ed ip/i.test(text)) {
    return `Brevo is blocking this server's IP address. Open ${BREVO_AUTHORIZED_IPS_URL} and deactivate "Authorized IPs" blocking (Render's outbound IPs change, so allowlisting a single IP is not reliable).`;
  }
  if (kind === 'api' && err.status === 401) {
    return 'Brevo rejected BREVO_API_KEY. It must be an API key starting with "xkeysib-" (Brevo > SMTP & API > API Keys), not the SMTP key starting with "xsmtpsib-".';
  }
  if (kind === 'api' && /sender/i.test(text)) {
    return `The sender address is not verified in Brevo. Add and verify it under Brevo > Senders, Domains & Dedicated IPs.`;
  }
  if (kind === 'smtp' && (['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNREFUSED'].includes(err.code) || /timeout/i.test(text))) {
    return 'Could not reach the SMTP server. Render\'s free tier blocks outbound ports 25/465/587; set BREVO_API_KEY to send over HTTPS instead.';
  }
  if (err.code === 'EAUTH') {
    return 'The SMTP server rejected the login. Check the SMTP username and password/key.';
  }
  return null;
};

const sendMailUniversal = async ({ to, subject, html, logType = 'Email' }) => {
  const providers = buildProviders(getEmailConfig());

  if (providers.length === 0) {
    console.error('❌ [Email Service] No email provider configured. Set BREVO_API_KEY, or BREVO_SMTP_USER + BREVO_SMTP_PASSWORD, or GMAIL_USER + GMAIL_PASS.');
    throw new Error(USER_FACING_EMAIL_ERROR);
  }

  for (const provider of providers) {
    try {
      const info = await provider.send({ to, subject, html });
      console.log(`✅ [${provider.name}] ${logType} delivered to ${to}${info?.messageId ? ` (ID: ${info.messageId})` : ''}`);
      return info;
    } catch (err) {
      console.error(`❌ [${provider.name}] Failed to send ${logType}: ${err.message}`);
      const fix = diagnoseEmailError(err, provider.kind);
      if (fix) console.error(`   ↳ Fix: ${fix}`);
    }
  }

  throw new Error(USER_FACING_EMAIL_ERROR);
};

export const sendOtpEmail = async (to, otp, type) => {
  const subject = type === 'register' 
    ? 'Verify Your Email Address - Shambhavi Imitation'
    : 'Reset Your Password - Shambhavi Imitation';

  const html = type === 'register' 
    ? getVerifyEmailHtml(otp)
    : getResetEmailHtml(otp);

  console.log(`🔑 [OTP DISPATCH] ${type.toUpperCase()} OTP for ${to}: ${otp}`);

  return await sendMailUniversal({ to, subject, html, logType: `${type.toUpperCase()} OTP` });
};

const getOrderEmailHtml = (order) => {
  const itemsHtml = order.orderItems.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #faf9f6; font-size: 14px; color: #121212;">
        <strong>${item.name}</strong>
        ${item.color || item.size ? `<br/><span style="font-size: 11px; color: #777;">${item.color ? `Color: ${item.color}` : ''} ${item.size ? `| Size: ${item.size}` : ''}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #faf9f6; font-size: 14px; text-align: center; color: #4a4a4a;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #faf9f6; font-size: 14px; text-align: right; color: #4a4a4a;">
        ₹${item.price.toLocaleString('en-IN')}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #faf9f6; font-size: 14px; text-align: right; font-weight: bold; color: #121212;">
        ₹${(item.price * item.quantity).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  return `
<div style="background-color: #faf9f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #121212;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2d7bd; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 30px; border-bottom: 1px solid #f1ebd9; padding-bottom: 20px; text-align: center;">
      <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.3em; color: #bca054; text-transform: uppercase; display: block; margin-bottom: 5px;">SHAMBHAVI IMITATION</span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #121212; margin: 0;">Order Confirmed</h2>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 25px;">
      Dear Customer,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 25px;">
      Thank you for shopping with Shambhavi Imitation. Your order has been placed successfully and is currently being processed. Here are your transaction details:
    </p>

    <!-- Order Summary Card -->
    <div style="background-color: #faf8f2; border: 1px solid #f1ebd9; padding: 15px 20px; margin-bottom: 30px; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Order Number:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #121212;">#${order._id}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Order Date:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #121212;">${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'long' })}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Payment Method:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #121212;">${order.paymentMethod} (${order.isPaid ? 'Paid' : 'Pending Payment'})</td>
        </tr>
      </table>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background-color: #faf8f2; border-bottom: 1px solid #e2d7bd;">
          <th style="padding: 12px; font-size: 12px; font-weight: bold; text-align: left; color: #bca054; text-transform: uppercase;">Item Description</th>
          <th style="padding: 12px; font-size: 12px; font-weight: bold; text-align: center; color: #bca054; text-transform: uppercase; width: 60px;">Qty</th>
          <th style="padding: 12px; font-size: 12px; font-weight: bold; text-align: right; color: #bca054; text-transform: uppercase; width: 100px;">Price</th>
          <th style="padding: 12px; font-size: 12px; font-weight: bold; text-align: right; color: #bca054; text-transform: uppercase; width: 100px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Pricing Summary -->
    <div style="border-top: 1px solid #f1ebd9; padding-top: 15px; margin-bottom: 30px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6;">
        <tr>
          <td style="color: #777;">Items Subtotal:</td>
          <td style="text-align: right; color: #121212;">₹${order.itemsPrice.toLocaleString('en-IN')}</td>
        </tr>
        ${order.discountPrice > 0 ? `
        <tr>
          <td style="color: #777;">Promo Code Discount:</td>
          <td style="text-align: right; color: #e53e3e;">-₹${order.discountPrice.toLocaleString('en-IN')}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="color: #777;">Express Delivery Shipping:</td>
          <td style="text-align: right; color: #121212;">${order.shippingPrice > 0 ? `₹${order.shippingPrice.toLocaleString('en-IN')}` : 'FREE'}</td>
        </tr>
        <tr style="font-size: 18px; font-weight: bold; border-top: 1px solid #f1ebd9; border-bottom: 1px solid #f1ebd9;">
          <td style="padding: 15px 0; color: #121212;">Order Total:</td>
          <td style="padding: 15px 0; text-align: right; color: #bca054;">₹${order.totalPrice.toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </div>

    <!-- Shipping Address Summary -->
    <div style="margin-bottom: 30px;">
      <h3 style="font-family: Georgia, serif; font-size: 16px; font-weight: bold; color: #121212; border-bottom: 1px solid #f1ebd9; padding-bottom: 8px; margin-top: 0;">Shipping Coordinates</h3>
      <p style="font-size: 13px; line-height: 1.6; color: #4a4a4a; margin: 5px 0;">
        ${order.shippingAddress.street}<br/>
        ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br/>
        <strong>Phone:</strong> ${order.shippingAddress.phone}<br/>
        <strong>Email:</strong> ${order.shippingAddress.email}
      </p>
    </div>

    <!-- Concierge Footer -->
    <p style="font-size: 13px; line-height: 1.6; color: #4a4a4a; text-align: center; margin-bottom: 30px;">
      If you have any questions or wish to customize/modify your order, please do not hesitate to contact our concierge team at kadamshambhavi1@gmail.com or via WhatsApp.
    </p>

    <div style="border-top: 1px solid #f1ebd9; padding-top: 25px; font-size: 11px; color: #888888; line-height: 1.4; text-align: center;">
      <p style="margin: 0 0 5px 0;">Shambhavi Imitation Jewelry</p>
      <p style="margin: 0;">Crafted with Elegance & Luxury</p>
    </div>
  </div>
</div>
  `;
};

export const sendOrderConfirmationEmail = async (to, order) => {
  const subject = `Your Order has been Placed Successfully! (Ref: #${order._id}) - Shambhavi Imitation`;
  const html = getOrderEmailHtml(order);
  return await sendMailUniversal({ to, subject, html, logType: 'Order Confirmation' });
};

const getCancellationEmailHtml = (order) => {
  const itemsHtml = order.orderItems.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #faf9f6; font-size: 14px; color: #121212;">
        <strong>${item.name}</strong>
        ${item.color || item.size ? `<br/><span style="font-size: 11px; color: #777;">${item.color ? `Color: ${item.color}` : ''} ${item.size ? `| Size: ${item.size}` : ''}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #faf9f6; font-size: 14px; text-align: center; color: #4a4a4a;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #faf9f6; font-size: 14px; text-align: right; color: #4a4a4a;">
        ₹${item.price.toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  return `
<div style="background-color: #faf9f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #121212;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2d7bd; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 30px; border-bottom: 1px solid #f1ebd9; padding-bottom: 20px; text-align: center;">
      <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.3em; color: #e53e3e; text-transform: uppercase; display: block; margin-bottom: 5px;">ORDER CANCELLED</span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #121212; margin: 0;">Cancellation Confirmed</h2>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 25px;">
      Dear Customer,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 25px;">
      We confirm that your order **#${order._id}** has been successfully cancelled as per your request. The items have been returned to our inventory, and any pending checkout hold has been released.
    </p>

    <!-- Order Summary Card -->
    <div style="background-color: #faf8f2; border: 1px solid #f1ebd9; padding: 15px 20px; margin-bottom: 30px; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Order Number:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #121212;">#${order._id}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Cancellation Status:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #e53e3e; font-weight: bold;">Cancelled</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Total Refundable Amount:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #121212; font-weight: bold;">₹${order.totalPrice.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Refund Details:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #4a4a4a;">
            ${order.paymentMethod === 'Razorpay' 
              ? 'Our accounts concierge will initiate the refund back to your original source account (takes 5-7 business days).' 
              : 'N/A (Cash on Delivery Order)'}
          </td>
        </tr>
      </table>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background-color: #faf8f2; border-bottom: 1px solid #e2d7bd;">
          <th style="padding: 12px; font-size: 12px; font-weight: bold; text-align: left; color: #bca054; text-transform: uppercase;">Cancelled Item</th>
          <th style="padding: 12px; font-size: 12px; font-weight: bold; text-align: center; color: #bca054; text-transform: uppercase; width: 60px;">Qty</th>
          <th style="padding: 12px; font-size: 12px; font-weight: bold; text-align: right; color: #bca054; text-transform: uppercase; width: 100px;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Concierge Footer -->
    <p style="font-size: 13px; line-height: 1.6; color: #4a4a4a; text-align: center; margin-bottom: 30px;">
      If you did not request this cancellation or have any queries regarding your refund timeline, please connect directly with our helpdesk at kadamshambhavi1@gmail.com.
    </p>

    <div style="border-top: 1px solid #f1ebd9; padding-top: 25px; font-size: 11px; color: #888888; line-height: 1.4; text-align: center;">
      <p style="margin: 0 0 5px 0;">Shambhavi Imitation Jewelry</p>
      <p style="margin: 0;">Crafted with Elegance & Luxury</p>
    </div>
  </div>
</div>
  `;
};

export const sendOrderCancellationEmail = async (to, order) => {
  const subject = `Order Cancelled Successfully (Ref: #${order._id}) - Shambhavi Imitation`;
  const html = getCancellationEmailHtml(order);
  return await sendMailUniversal({ to, subject, html, logType: 'Order Cancellation' });
};

const getRefundEmailHtml = (order) => `
<div style="background-color: #faf9f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #121212;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2d7bd; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 30px; border-bottom: 1px solid #f1ebd9; padding-bottom: 20px; text-align: center;">
      <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.3em; color: #bca054; text-transform: uppercase; display: block; margin-bottom: 5px;">SHAMBHAVI IMITATION</span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #121212; margin: 0;">Payment Refund Processed</h2>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 25px;">
      Dear Customer,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 25px;">
      We have processed the full payment refund for your order <strong>#${order._id}</strong>. The total amount of <strong>₹${order.totalPrice.toLocaleString('en-IN')}</strong> has been credited/initiated back to your original source payment method.
    </p>
    <div style="background-color: #faf8f2; border: 1px solid #f1ebd9; padding: 15px 20px; margin-bottom: 30px; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Order Reference:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #121212;">#${order._id}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Refund Amount:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #bca054; font-weight: bold;">₹${order.totalPrice.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Status:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #2e7d32; font-weight: bold;">Refund Processed</td>
        </tr>
      </table>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #4a4a4a; text-align: center; margin-bottom: 30px;">
      If you have questions regarding your refund, write to us at kadamshambhavi1@gmail.com.
    </p>
    <div style="border-top: 1px solid #f1ebd9; padding-top: 25px; font-size: 11px; color: #888888; line-height: 1.4; text-align: center;">
      <p style="margin: 0 0 5px 0;">Shambhavi Imitation Jewelry</p>
      <p style="margin: 0;">Crafted with Elegance & Luxury</p>
    </div>
  </div>
</div>
`;

export const sendOrderRefundEmail = async (to, order) => {
  const subject = `Payment Refund Processed (Ref: #${order._id}) - Shambhavi Imitation`;
  const html = getRefundEmailHtml(order);
  try {
    return await sendMailUniversal({ to, subject, html, logType: 'Order Refund' });
  } catch (error) {
    console.error('❌ Failed to send refund email notice:', error.message);
  }
};

const getDeliveryEmailHtml = (order) => `
<div style="background-color: #faf9f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #121212;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2d7bd; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 30px; border-bottom: 1px solid #f1ebd9; padding-bottom: 20px; text-align: center;">
      <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.3em; color: #2e7d32; text-transform: uppercase; display: block; margin-bottom: 5px;">DELIVERY CONFIRMED</span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #121212; margin: 0;">Order Delivered Successfully</h2>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 25px;">
      Dear Customer,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 25px;">
      Your handcrafted jewelry order <strong>#${order._id}</strong> has been delivered! We hope you love your new pieces.
    </p>
    <div style="background-color: #faf8f2; border: 1px solid #f1ebd9; padding: 15px 20px; margin-bottom: 30px; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Order Number:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #121212;">#${order._id}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Delivery Status:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #2e7d32; font-weight: bold;">Delivered</td>
        </tr>
      </table>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #4a4a4a; text-align: center; margin-bottom: 30px;">
      Thank you for choosing Shambhavi Imitation Jewelry! For any assistance, email kadamshambhavi1@gmail.com.
    </p>
    <div style="border-top: 1px solid #f1ebd9; padding-top: 25px; font-size: 11px; color: #888888; line-height: 1.4; text-align: center;">
      <p style="margin: 0 0 5px 0;">Shambhavi Imitation Jewelry</p>
      <p style="margin: 0;">Crafted with Elegance & Luxury</p>
    </div>
  </div>
</div>
`;

export const sendOrderDeliveryEmail = async (to, order) => {
  const subject = `Your Order Has Been Delivered! (Ref: #${order._id}) - Shambhavi Imitation`;
  const html = getDeliveryEmailHtml(order);
  try {
    return await sendMailUniversal({ to, subject, html, logType: 'Order Delivery' });
  } catch (error) {
    console.error('❌ Failed to send delivery email notice:', error.message);
  }
};

const getCancellationRejectedEmailHtml = (order, reason) => `
<div style="background-color: #faf9f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #121212;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2d7bd; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 30px; border-bottom: 1px solid #f1ebd9; padding-bottom: 20px; text-align: center;">
      <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.3em; color: #bca054; text-transform: uppercase; display: block; margin-bottom: 5px;">CANCELLATION REQUEST UPDATE</span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #121212; margin: 0;">Cancellation Request Declined</h2>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 25px;">
      Dear Customer,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 25px;">
      Your request to cancel order <strong>#${order._id}</strong> could not be approved at this time. Your order remains active and is being processed for fulfillment.
    </p>
    <div style="background-color: #faf8f2; border: 1px solid #f1ebd9; padding: 15px 20px; margin-bottom: 30px; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Order Number:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #121212;">#${order._id}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Current Status:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #bca054; font-weight: bold;">${order.orderStatus}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #777;"><strong>Admin Note:</strong></td>
          <td style="padding: 4px 0; text-align: right; color: #e53e3e;">${reason}</td>
        </tr>
      </table>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #4a4a4a; text-align: center; margin-bottom: 30px;">
      For further questions regarding your order status, please contact kadamshambhavi1@gmail.com.
    </p>
    <div style="border-top: 1px solid #f1ebd9; padding-top: 25px; font-size: 11px; color: #888888; line-height: 1.4; text-align: center;">
      <p style="margin: 0 0 5px 0;">Shambhavi Imitation Jewelry</p>
      <p style="margin: 0;">Crafted with Elegance & Luxury</p>
    </div>
  </div>
</div>
`;

export const sendCancellationRejectedEmail = async (to, order, reason) => {
  const subject = `Update on Cancellation Request (Ref: #${order._id}) - Shambhavi Imitation`;
  const html = getCancellationRejectedEmailHtml(order, reason);
  try {
    return await sendMailUniversal({ to, subject, html, logType: 'Cancellation Rejection' });
  } catch (error) {
    console.error('❌ Failed to send cancellation rejection email notice:', error.message);
  }
};

const getShippedEmailHtml = (order) => {
  const courier = order.courierName || 'Standard Express Courier';
  const trackingNum = order.trackingNumber || order.trackingId || 'N/A';
  
  let trackingUrl = `http://localhost:5175/order-tracking?orderId=${order._id}`;
  const cLower = courier.toLowerCase();
  if (cLower.includes('delhivery')) {
    trackingUrl = `https://www.delhivery.com/track/package/${trackingNum}`;
  } else if (cLower.includes('blue dart') || cLower.includes('bluedart')) {
    trackingUrl = `https://www.bluedart.com/tracking?trackNumber=${trackingNum}`;
  } else if (cLower.includes('dtdc')) {
    trackingUrl = `https://www.dtdc.in/`;
  } else if (cLower.includes('shiprocket')) {
    trackingUrl = `https://shiprocket.co/tracking/${trackingNum}`;
  } else if (cLower.includes('ekart')) {
    trackingUrl = `https://ekartlogistics.com/shipmenttrack/${trackingNum}`;
  }

  const itemsHtml = (order.orderItems || []).map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #faf9f6; font-size: 14px; color: #121212;">
        <strong>${item.name}</strong>
        ${item.color || item.size ? `<br/><span style="font-size: 11px; color: #777;">${item.color ? `Color: ${item.color}` : ''} ${item.size ? `| Size: ${item.size}` : ''}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #faf9f6; font-size: 14px; text-align: center; color: #4a4a4a;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #faf9f6; font-size: 14px; text-align: right; color: #4a4a4a;">
        ₹${item.price?.toLocaleString('en-IN') || item.price}
      </td>
    </tr>
  `).join('');

  return `
<div style="background-color: #faf9f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #121212;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2d7bd; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 30px; border-bottom: 1px solid #f1ebd9; padding-bottom: 20px; text-align: center;">
      <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.3em; color: #bca054; text-transform: uppercase; display: block; margin-bottom: 5px;">SHAMBHAVI IMITATION</span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #121212; margin: 0;">Your Order is On Its Way! 🚚</h2>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 20px;">
      Dear Customer,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 25px;">
      Great news! Your handcrafted jewelry order <strong>#${order._id}</strong> has been carefully packed and dispatched through our trusted logistics partner.
    </p>

    <!-- Tracking Card -->
    <div style="background-color: #faf8f2; border: 2px solid #bca054; padding: 20px; margin-bottom: 30px; border-radius: 6px; text-align: center;">
      <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.15em; color: #856404; display: block; margin-bottom: 8px;">Delivery Dispatch Summary</span>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; text-align: left;">
        <tr>
          <td style="padding: 6px 0; color: #666;"><strong>Courier Partner:</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #121212; font-weight: bold;">${courier}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;"><strong>Tracking Number (AWB):</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #bca054; font-weight: bold; font-family: monospace; font-size: 15px;">${trackingNum}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;"><strong>Status:</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #0284c7; font-weight: bold;">In Transit / Shipped</td>
        </tr>
      </table>
      
      <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #bca054; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 5px;">
        Track Your Package &rarr;
      </a>
    </div>

    <!-- Items in Shipment -->
    <h3 style="font-family: Georgia, serif; font-size: 15px; font-weight: bold; color: #121212; margin-bottom: 12px; border-bottom: 1px solid #f1ebd9; padding-bottom: 6px;">Shipment Contents</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background-color: #faf8f2; border-bottom: 1px solid #e2d7bd;">
          <th style="padding: 10px; font-size: 11px; font-weight: bold; text-align: left; color: #bca054; text-transform: uppercase;">Item</th>
          <th style="padding: 10px; font-size: 11px; font-weight: bold; text-align: center; color: #bca054; text-transform: uppercase;">Qty</th>
          <th style="padding: 10px; font-size: 11px; font-weight: bold; text-align: right; color: #bca054; text-transform: uppercase;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Shipping Destination -->
    <div style="margin-bottom: 30px; background-color: #faf9f6; padding: 15px; border-left: 3px solid #bca054;">
      <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #121212; margin: 0 0 8px 0;">Destination Address</h4>
      <p style="font-size: 13px; line-height: 1.5; color: #4a4a4a; margin: 0;">
        ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}<br/>
        <strong>Recipient Phone:</strong> ${order.shippingAddress?.phone || ''}
      </p>
    </div>

    <p style="font-size: 12px; line-height: 1.6; color: #777777; text-align: center; margin-bottom: 30px;">
      Please ensure someone is available at the delivery location to receive the parcel. For any delivery queries, reach us at kadamshambhavi1@gmail.com.
    </p>

    <div style="border-top: 1px solid #f1ebd9; padding-top: 25px; font-size: 11px; color: #888888; line-height: 1.4; text-align: center;">
      <p style="margin: 0 0 5px 0;">Shambhavi Imitation Jewelry</p>
      <p style="margin: 0;">Crafted with Elegance & Luxury</p>
    </div>
  </div>
</div>
  `;
};

export const sendOrderShippedEmail = async (to, order) => {
  const subject = `Your Order Has Been Shipped! (Tracking Ref: #${order.trackingNumber || order.trackingId || order._id}) - Shambhavi Imitation`;
  const html = getShippedEmailHtml(order);
  try {
    return await sendMailUniversal({ to, subject, html, logType: 'Order Shipped' });
  } catch (error) {
    console.error('❌ Failed to send order shipped email notice:', error.message);
  }
};


