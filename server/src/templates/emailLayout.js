import { escapeHtml } from '../utils/helpers.js';

const BRAND = {
  black: '#0d0d0d',
  orange: '#ff6a00',
  grey: '#6b6b6b',
  light: '#f5f5f4',
};

/**
 * Wraps email content in a responsive, table-based layout that works in
 * most email clients. `bodyHtml` must already be escaped by the caller.
 */
export function renderLayout({ preheader = '', title, bodyHtml, cta }) {
  const button = cta
    ? `<tr><td style="padding:8px 32px 28px;">
        <a href="${escapeHtml(cta.url)}" style="display:inline-block;background:${BRAND.orange};color:#ffffff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;">${escapeHtml(cta.label)}</a>
      </td></tr>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.light};font-family:Arial,Helvetica,sans-serif;color:${BRAND.black};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.light};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr><td style="background:${BRAND.black};padding:20px 32px;">
        <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">FIT<span style="color:${BRAND.orange};">STORE</span></span>
        <div style="color:#bdbdbd;font-size:12px;margin-top:4px;">Fuel Your Fitness Journey.</div>
      </td></tr>
      <tr><td style="padding:28px 32px 8px;">
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${escapeHtml(title)}</h1>
        ${bodyHtml}
      </td></tr>
      ${button}
      <tr><td style="padding:18px 32px;background:#fafafa;border-top:1px solid #eeeeee;font-size:12px;color:${BRAND.grey};line-height:1.6;">
        FitStore is a college demo project. Payments are processed in Razorpay <strong>test mode</strong> - no real money is charged.<br>
        You received this email because of activity on your FitStore account.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export { BRAND };
