import StaticPage from '../components/StaticPage';

export default function PrivacyPage() {
  return (
    <StaticPage eyebrow="Policies" title="Privacy Policy" updated="October 2026">
      <p>This policy explains what FitStore (a college demonstration project) collects and why.</p>
      <h2>Information we collect</h2>
      <ul>
        <li><strong>Google account details:</strong> your name, email address, profile picture and Google account ID, received after Google verifies your sign-in. We never receive your Google password.</li>
        <li><strong>Order details:</strong> delivery address, phone number, items ordered and payment status.</li>
        <li><strong>Payment references:</strong> Razorpay order and payment IDs. Card and UPI details are handled entirely by Razorpay and never reach our servers.</li>
        <li><strong>Reviews</strong> you choose to publish.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To sign you in, manage your cart and process orders.</li>
        <li>To send transactional emails (welcome, order confirmation, payment and status updates) via our email provider, Resend.</li>
        <li>We do not sell your data or send marketing emails.</li>
      </ul>
      <h2>Cookies</h2>
      <p>We use a single secure, HttpOnly session cookie to keep you signed in. It cannot be read by JavaScript and expires automatically.</p>
      <h2>Your choices</h2>
      <p>You can sign out at any time and delete saved addresses from your profile. Contact us to request deletion of your account data.</p>
    </StaticPage>
  );
}
