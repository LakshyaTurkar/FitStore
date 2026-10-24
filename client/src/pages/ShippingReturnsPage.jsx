import { storeApi } from '../api/endpoints';
import useApi from '../hooks/useApi';
import StaticPage from '../components/StaticPage';
import { formatINR } from '../utils/format';

export default function ShippingReturnsPage() {
  const { data } = useApi(() => storeApi.config().then((r) => r.data), []);
  const fee = formatINR(data?.shippingCharge ?? 99);
  const free = formatINR(data?.freeShippingThreshold ?? 999);

  return (
    <StaticPage eyebrow="Policies" title="Shipping & Return Policy" updated="October 2026">
      <h2 id="shipping">Shipping Policy</h2>
      <ul>
        <li>We ship across India.</li>
        <li>Orders of {free} or more (after discounts) ship <strong>free</strong>. A flat fee of {fee} applies to smaller orders.</li>
        <li>Orders are processed within 1-2 business days after payment is confirmed.</li>
        <li>Estimated delivery: 3-7 business days depending on location.</li>
        <li>Tracking numbers shown in this demo are <strong>simulated</strong> and not linked to a real courier.</li>
      </ul>

      <h2 id="returns">Return Policy</h2>
      <ul>
        <li>Unused products in original packaging can be returned within 7 days of delivery.</li>
        <li>For hygiene and safety reasons, opened supplements cannot be returned.</li>
        <li>Damaged or incorrect items are replaced or refunded at no extra cost.</li>
        <li>To start a return, contact us with your order number.</li>
      </ul>

      <h2>Cancellations &amp; Refunds</h2>
      <ul>
        <li>You can cancel an order yourself while it is awaiting payment or confirmed.</li>
        <li>
          Refunds in this demo are <strong>simulated</strong>. Because payments run in Razorpay test mode, no real money is ever
          charged or refunded.
        </li>
      </ul>
    </StaticPage>
  );
}
