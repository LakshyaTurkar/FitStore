import { Link } from 'react-router-dom';
import StaticPage from '../components/StaticPage';

const FAQS = [
  ['Do I need an account to shop?', 'You can browse without signing in. To add items to your cart and place orders, sign in with your Google account - no password is needed.'],
  ['Is this a real store? Will I be charged?', 'No. FitStore is a college demonstration project. Payments run in Razorpay test mode, so no real money is ever charged.'],
  ['Which test payment details can I use?', 'Choose UPI and enter the test UPI ID success@razorpay for a successful payment, or failure@razorpay to simulate a failed one. Test card numbers are listed in Razorpay\'s official "Test Card Details" documentation.'],
  ['How is shipping charged?', 'A flat shipping fee applies to orders below the free-shipping threshold. Orders above the threshold ship free. The exact amounts are shown in your cart.'],
  ['How do I track my order?', 'Open My Orders from your profile menu. Each order shows its payment status, order status and a timeline. Tracking numbers are simulated for this demo.'],
  ['Can I cancel my order?', 'Yes - you can cancel an order while it is awaiting payment or confirmed. Once it is being processed or shipped, please contact us.'],
  ['My payment failed. What now?', 'Your order stays in "Pending Payment". Open the order and click Retry payment. If items went out of stock, you will be asked to update your cart.'],
  ['How do reviews work?', 'Signed-in customers can leave one review per product. Reviews from customers who bought the product show a "Verified purchase" badge. Sample reviews are labelled "Demo review".'],
];

export default function FAQPage() {
  return (
    <StaticPage eyebrow="Help" title="Frequently Asked Questions" subtitle="Quick answers to common questions.">
      <div className="faq">
        {FAQS.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <p>Still need help? <Link to="/contact">Contact us</Link>.</p>
    </StaticPage>
  );
}
