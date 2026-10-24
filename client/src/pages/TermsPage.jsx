import StaticPage from '../components/StaticPage';

export default function TermsPage() {
  return (
    <StaticPage eyebrow="Policies" title="Terms & Conditions" updated="October 2026">
      <h2>1. About this website</h2>
      <p>FitStore is a college demonstration project. Products, prices and stock are sample data. No real goods are sold or delivered.</p>
      <h2>2. Accounts</h2>
      <p>You sign in with Google. You are responsible for activity on your account. Admin access is granted only by the project owner.</p>
      <h2>3. Pricing and payments</h2>
      <p>Prices are in Indian Rupees (INR) and are calculated by our server at checkout. Payments are processed by Razorpay in <strong>test mode</strong>; no real money is charged.</p>
      <h2>4. Orders</h2>
      <p>An order is confirmed only after our server verifies the payment. We may cancel orders if an item becomes unavailable.</p>
      <h2>5. Reviews</h2>
      <p>Reviews must be honest and respectful. We may remove content that is abusive, misleading or unrelated to the product.</p>
      <h2>6. Liability</h2>
      <p>This site is provided &quot;as is&quot; for educational purposes without warranties of any kind.</p>
    </StaticPage>
  );
}
