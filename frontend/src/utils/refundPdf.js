/**
 * Generates and triggers the browser print-to-PDF dialogue for an Official Refund Receipt / Credit Note.
 * Supports generating for the entire order or targeted for a particular product.
 *
 * @param {Object} order - The order object with refund details
 * @param {Object|null} specificItem - Optional single product item to generate a dedicated refund slip for
 */
export const generateRefundPDF = (order, specificItem = null) => {
  if (!order) return;

  const orderId = order._id || order.id || 'N/A';
  const orderCode = String(orderId).substring(Math.max(0, String(orderId).length - 6)).toUpperCase();
  const customerName = order.shippingAddress?.name || order.user?.name || 'Customer';
  const customerEmail = order.shippingAddress?.email || order.user?.email || 'N/A';
  const customerPhone = order.shippingAddress?.phone || order.user?.phone || 'N/A';
  
  const destination = order.shippingAddress 
    ? [order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode].filter(Boolean).join(', ')
    : (order.destination || 'India');

  const fullOrderTotal = Number(order.totalPrice || order.total || 0);
  const refundAmount = Number(order.refundAmount || fullOrderTotal);
  const refundReason = order.refundReason || 'Customer Return / Cancellation Refund';
  const refundRef = order.refundTransactionId || `REF_${Date.now()}_${orderCode}`;

  const refundDateFormatted = order.refundedAt 
    ? new Date(order.refundedAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });

  const itemsToRender = specificItem ? [specificItem] : (order.orderItems || order.items || []);

  const itemsHtml = itemsToRender.map((item, idx) => {
    const itemName = item.name || 'Handcrafted Jewelry Design';
    const itemSku = item.sku || item.product?.sku || 'N/A';
    const itemAttr = `${item.color || 'Standard'} / ${item.size || 'Standard'}`;
    const itemPrice = Number(item.price || 0);
    const itemQty = Number(item.quantity || 1);
    const itemTotal = itemPrice * itemQty;

    return `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">${idx + 1}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 700; font-size: 12px; color: #1e293b;">${itemName}</div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 2px;">
            SKU: ${itemSku} &nbsp;|&nbsp; Color/Size: ${itemAttr}
          </div>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; font-weight: 600;">${itemQty}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 12px;">₹${itemPrice.toLocaleString('en-IN')}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; font-size: 12px; color: #7e22ce;">₹${itemTotal.toLocaleString('en-IN')}</td>
      </tr>
    `;
  }).join('');

  const targetHeading = specificItem ? `Product Refund Slip — ${specificItem.name || 'Jewelry Item'}` : 'Refunded Order Items';
  const effectiveRefundAmount = specificItem ? Number(specificItem.price * (specificItem.quantity || 1)) : refundAmount;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Refund Receipt #${orderCode} - Shambhavi Imitation</title>
      <style>
        @page { size: A4; margin: 18mm; }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 24px;
          background: #ffffff;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #7e22ce;
          padding-bottom: 18px;
          margin-bottom: 22px;
        }
        .brand-title {
          font-family: Georgia, serif;
          font-size: 24px;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .brand-sub {
          font-size: 10px;
          font-weight: 700;
          color: #c5a059;
          text-transform: uppercase;
          letter-spacing: 2.5px;
          margin-top: 2px;
        }
        .badge-refund {
          background: #f3e8ff;
          color: #7e22ce;
          border: 1px solid #d8b4fe;
          font-size: 11px;
          font-weight: 800;
          padding: 5px 12px;
          text-transform: uppercase;
          border-radius: 4px;
          display: inline-block;
          letter-spacing: 0.5px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 22px;
        }
        .meta-box {
          background: #faf8f5;
          border: 1px solid #e9dfcf;
          padding: 14px;
          border-radius: 4px;
        }
        .meta-label {
          font-size: 9px;
          font-weight: 700;
          color: #9a7b43;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        .meta-val {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0 20px 0;
        }
        th {
          background: #f8fafc;
          padding: 10px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #475569;
          border-bottom: 2px solid #cbd5e1;
          letter-spacing: 0.5px;
          text-align: left;
        }
        .totals-table {
          width: 100%;
          max-width: 340px;
          margin-left: auto;
          border-collapse: collapse;
          margin-top: 8px;
        }
        .totals-table td {
          padding: 6px 10px;
          font-size: 12px;
          color: #334155;
        }
        .totals-final {
          border-top: 2px solid #7e22ce;
          font-size: 15px !important;
          font-weight: 800 !important;
          color: #7e22ce;
        }
        .notice-box {
          background: #faf5ff;
          border: 1px dashed #c084fc;
          padding: 14px 16px;
          border-radius: 4px;
          margin-top: 24px;
          font-size: 11px;
          color: #581c87;
          line-height: 1.6;
        }
        .footer-note {
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
          margin-top: 32px;
          border-top: 1px solid #e2e8f0;
          padding-top: 14px;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand-title">Shambhavi Imitation</div>
          <div class="brand-sub">Luxury Handcrafted Jewelry</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Official Refund Voucher & Credit Note</div>
        </div>
        <div style="text-align: right;">
          <span class="badge-refund">✓ Refund Confirmed</span>
          <div style="font-size: 12px; font-weight: bold; margin-top: 8px; color: #334155; font-family: monospace;">Ref: ${refundRef}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Issued on: ${refundDateFormatted}</div>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-box">
          <div class="meta-label">Customer Information</div>
          <div class="meta-val">${customerName}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">Email: ${customerEmail}</div>
          <div style="font-size: 11px; color: #475569;">Phone: ${customerPhone}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">Destination: ${destination}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Transaction Information</div>
          <div style="font-size: 11px; color: #475569;">Original Order ID: <strong style="font-family: monospace;">#${orderId}</strong></div>
          <div style="font-size: 11px; color: #475569;">Payment Method: <strong>${order.paymentMethod || 'Razorpay / Prepaid'}</strong></div>
          <div style="font-size: 11px; color: #475569;">Status: <strong style="color: #7e22ce;">REFUND PROCESSED</strong></div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">Reason: <em>"${refundReason}"</em></div>
        </div>
      </div>

      <div style="font-weight: 700; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 6px;">
        ${targetHeading}
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px;">#</th>
            <th>Jewelry Design Description</th>
            <th style="text-align: center; width: 65px;">Qty</th>
            <th style="text-align: right; width: 110px;">Unit Price</th>
            <th style="text-align: right; width: 120px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <table class="totals-table">
        <tr>
          <td>Order Subtotal:</td>
          <td style="text-align: right; font-weight: 600;">₹${fullOrderTotal.toLocaleString('en-IN')}</td>
        </tr>
        <tr class="totals-final">
          <td>Total Refunded Amount:</td>
          <td style="text-align: right;">₹${effectiveRefundAmount.toLocaleString('en-IN')}</td>
        </tr>
      </table>

      <div class="notice-box">
        <strong>Official Confirmation of Refund:</strong><br />
        This credit document confirms that a refund of <strong>₹${effectiveRefundAmount.toLocaleString('en-IN')}</strong> has been successfully processed by <strong>Shambhavi Imitation Jewelry</strong>. The amount has been credited back to your original payment method or registered bank account. For inquiries, email us at <strong>kadamshambhavi1@gmail.com</strong>.
      </div>

      <div class="footer-note">
        Shambhavi Imitation Jewelry • Authentic Handcrafted Imitation Jewelry • All Rights Reserved.
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'height=850,width=850');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};
