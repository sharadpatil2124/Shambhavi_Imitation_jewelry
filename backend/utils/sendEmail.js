import nodemailer from 'nodemailer';

// Luxury HTML Email Templates
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

export const sendOtpEmail = async (to, otp, type) => {
  const clean = (val) => val ? val.replace(/^['"]|['"]$/g, '').trim() : '';

  const host = clean(process.env.BREVO_SMTP_HOST) || 'smtp-relay.brevo.com';
  const port = parseInt(clean(process.env.BREVO_SMTP_PORT) || '587', 10);
  const user = clean(process.env.BREVO_SMTP_USER);
  const pass = clean(process.env.BREVO_SMTP_PASSWORD);
  const fromEmail = clean(process.env.BREVO_EMAIL_FROM) || 'no-reply@sambhavijewelry.com';
  const fromName = clean(process.env.BREVO_EMAIL_FROM_NAME) || 'Shambhavi Imitation';

  const subject = type === 'register' 
    ? 'Verify Your Email Address - Shambhavi Imitation'
    : 'Reset Your Password - Shambhavi Imitation';

  const html = type === 'register' 
    ? getVerifyEmailHtml(otp)
    : getResetEmailHtml(otp);

  if (!user || !pass) {
    throw new Error('SMTP credentials are not configured. Email communication is unavailable.');
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('\n❌ [BREVO SMTP ERROR] Failed to send email:', error.message);
    throw new Error(`SMTP email delivery failed: ${error.message}`);
  }
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
      If you have any questions or wish to customize/modify your order, please do not hesitate to contact our concierge team at support@shambhavi-imitation.com or via WhatsApp.
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
  const clean = (val) => val ? val.replace(/^['"]|['"]$/g, '').trim() : '';

  const host = clean(process.env.BREVO_SMTP_HOST) || 'smtp-relay.brevo.com';
  const port = parseInt(clean(process.env.BREVO_SMTP_PORT) || '587', 10);
  const user = clean(process.env.BREVO_SMTP_USER);
  const pass = clean(process.env.BREVO_SMTP_PASSWORD);
  const fromEmail = clean(process.env.BREVO_EMAIL_FROM) || 'no-reply@sambhavijewelry.com';
  const fromName = clean(process.env.BREVO_EMAIL_FROM_NAME) || 'Shambhavi Imitation';

  const subject = `Your Order has been Placed Successfully! (Ref: #${order._id}) - Shambhavi Imitation`;
  const html = getOrderEmailHtml(order);

  if (!user || !pass) {
    throw new Error('SMTP credentials are not configured. Email communication is unavailable.');
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('\n❌ [BREVO SMTP ERROR] Failed to send order email:', error.message);
    throw new Error(`SMTP email delivery failed: ${error.message}`);
  }
};

