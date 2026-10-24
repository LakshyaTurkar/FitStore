import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AlertTriangle, CreditCard, FlaskConical, Lock } from 'lucide-react';
import { orderApi, userApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useRazorpayCheckout from '../hooks/useRazorpayCheckout';
import PageHeader from '../components/PageHeader';
import AddressForm from '../components/AddressForm';
import FormField from '../components/FormField';
import OrderSummary from '../components/OrderSummary';
import { Spinner } from '../components/Feedback';
import { EMPTY_ADDRESS, validateAddressForm } from '../utils/validation';
import { formatINR } from '../utils/format';

export default function CheckoutPage() {
  useDocumentTitle('Checkout');
  const { user } = useAuth();
  const { cart, ready: cartReady } = useCart();
  const toast = useToast();
  const { openCheckout, opening } = useRazorpayCheckout();

  const [address, setAddress] = useState({ ...EMPTY_ADDRESS, fullName: user.name });
  const [errors, setErrors] = useState({});
  const [saveAddress, setSaveAddress] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    userApi
      .addresses()
      .then((res) => {
        setSavedAddresses(res.data);
        if (res.data.length) {
          const { _id, ...first } = res.data[0];
          setAddress({ ...EMPTY_ADDRESS, ...first });
          setSaveAddress(false);
        }
      })
      .catch(() => {});
  }, []);

  if (!cartReady) return <Spinner label="Loading your cart..." />;
  if (!cart.items.length && !submitting) return <Navigate to="/cart" replace />;

  const chooseSaved = (e) => {
    const chosen = savedAddresses.find((a) => a._id === e.target.value);
    if (chosen) {
      const { _id, ...rest } = chosen;
      setAddress({ ...EMPTY_ADDRESS, ...rest });
      setErrors({});
      setSaveAddress(false);
    }
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    const clientErrors = validateAddressForm(address);
    setErrors(clientErrors);
    setProblems([]);
    if (Object.keys(clientErrors).length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      // The server re-reads the cart, prices it from the database and creates the Razorpay order.
      const res = await orderApi.checkout({ shippingAddress: address, saveAddress });
      await openCheckout(res.data);
    } catch (err) {
      if (err.status === 409 && Array.isArray(err.details)) setProblems(err.details);
      else if (err.details && typeof err.details === 'object') setErrors(err.details);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || opening;

  return (
    <>
      <PageHeader eyebrow="Secure checkout" title="Checkout" />
      <div className="container section">
        <div className="alert alert--warn checkout-demo">
          <FlaskConical size={18} />
          <span>
            <strong>Test payment environment.</strong> Pay with test UPI ID <code>success@razorpay</code> (or <code>failure@razorpay</code> to simulate a failure), or any test card from Razorpay&apos;s documentation. No real money is charged.
          </span>
        </div>

        <form className="two-col" onSubmit={placeOrder} noValidate>
          <div className="card checkout-form">
            <h2>Delivery details</h2>

            {savedAddresses.length > 0 && (
              <FormField id="saved-address" label="Use a saved address">
                <select id="saved-address" onChange={chooseSaved} defaultValue={savedAddresses[0]._id}>
                  {savedAddresses.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.fullName} - {a.line1}, {a.city} {a.pincode}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField id="checkout-email" label="Email (from your Google account)">
              <input id="checkout-email" type="email" value={user.email} readOnly aria-readonly="true" />
            </FormField>

            <AddressForm values={address} errors={errors} onChange={setAddress} idPrefix="checkout" />

            <label className="checkbox">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              Save this address to my profile
            </label>

            <h2 className="checkout-form__pay">Payment method</h2>
            <div className="pay-option">
              <CreditCard size={22} />
              <div>
                <strong>Razorpay (Test Mode)</strong>
                <p>Cards, UPI, net banking and wallets via Razorpay&apos;s secure checkout.</p>
              </div>
            </div>
          </div>

          <OrderSummary totals={cart.totals}>
            <ul className="summary__items">
              {cart.items.map((i) => (
                <li key={i.product._id}>
                  <img src={i.product.image} alt="" />
                  <span>{i.product.name} &times; {i.quantity}</span>
                  <strong>{formatINR(i.lineTotal)}</strong>
                </li>
              ))}
            </ul>

            {problems.length > 0 && (
              <div className="alert alert--error" role="alert">
                <AlertTriangle size={18} />
                <div>
                  {problems.map((p) => <div key={String(p.productId)}>{p.message}</div>)}
                  <Link to="/cart">Update cart</Link>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy || cart.hasStockIssues}>
              <Lock size={18} /> {busy ? 'Starting secure payment...' : `Pay ${formatINR(cart.totals.total)} (Test)`}
            </button>
            <p className="summary__note">The final amount is calculated by our server from current prices. You will not be charged real money.</p>
          </OrderSummary>
        </form>
      </div>
    </>
  );
}
