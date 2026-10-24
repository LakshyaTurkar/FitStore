import './helpers/env.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAddress, validateReview } from '../src/utils/validators.js';
import { escapeHtml } from '../src/utils/helpers.js';
import { orderConfirmedEmail } from '../src/templates/emails.js';

const goodAddress = { fullName: 'Asha Verma', phone: '+91 98765-43210', line1: '12 MG Road, Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' };

test('valid address is cleaned (phone normalised)', () => {
  const address = validateAddress(goodAddress);
  assert.equal(address.phone, '9876543210');
  assert.equal(address.line2, '');
});

test('invalid address returns field-level errors', () => {
  assert.throws(
    () => validateAddress({ ...goodAddress, phone: '12345', pincode: '0123' }),
    (err) => err.statusCode === 400 && Boolean(err.details.phone && err.details.pincode),
  );
});

test('review rating and length are validated', () => {
  assert.throws(() => validateReview({ rating: 6, comment: 'Great product overall!' }), /review/);
  assert.throws(() => validateReview({ rating: 4, comment: 'short' }), /review/);
  assert.deepEqual(validateReview({ rating: '5', comment: '  Really good quality.  ' }), { rating: 5, comment: 'Really good quality.' });
});

test('user content is HTML-escaped in emails', () => {
  assert.equal(escapeHtml('<script>"x"&\'y\'</script>'), '&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;');
  const order = {
    _id: 'abc',
    orderNumber: 'FS-1',
    paymentStatus: 'Paid',
    orderStatus: 'Confirmed',
    items: [{ name: 'Mat', quantity: 1, lineTotal: 100 }],
    subtotal: 100,
    discount: 0,
    shippingCharge: 99,
    totalAmount: 199,
    shippingAddress: { ...goodAddress, fullName: '<img src=x onerror=alert(1)>' },
  };
  const { html, text } = orderConfirmedEmail(order, { name: '<b>Eve</b>' });
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('<b>Eve</b>'));
  assert.ok(text.includes('FS-1'));
});
