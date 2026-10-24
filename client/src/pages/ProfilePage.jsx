import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, MapPin, Package, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { userApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import PageHeader from '../components/PageHeader';
import AddressForm from '../components/AddressForm';
import { ErrorState, Spinner } from '../components/Feedback';
import { EMPTY_ADDRESS, validateAddressForm } from '../utils/validation';
import { formatDate } from '../utils/format';

export default function ProfilePage() {
  useDocumentTitle('My Profile');
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const addresses = useApi(() => userApi.addresses().then((r) => r.data), []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const clientErrors = validateAddressForm(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;
    setSaving(true);
    try {
      const res = await userApi.addAddress(form);
      addresses.setData(res.data);
      setAdding(false);
      setForm(EMPTY_ADDRESS);
      toast.success('Address saved.');
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      const res = await userApi.deleteAddress(id);
      addresses.setData(res.data);
      toast.info('Address removed.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onLogout = async () => {
    await logout();
    toast.info('You have been signed out.');
    navigate('/');
  };

  return (
    <>
      <PageHeader title="My Profile" />
      <div className="container section profile">
        <div className="card profile__card">
          {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" /> : <span className="avatar-fallback avatar-fallback--lg">{user.name[0]}</span>}
          <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <p className="muted">Signed in with Google &middot; Member since {formatDate(user.createdAt)}</p>
            {isAdmin && <span className="badge badge--orange"><ShieldCheck size={13} /> Admin</span>}
          </div>
          <div className="profile__actions">
            <Link to="/orders" className="btn btn--dark"><Package size={18} /> My Orders</Link>
            {isAdmin && <Link to="/admin" className="btn btn--outline">Admin Panel</Link>}
            <button type="button" className="btn btn--ghost" onClick={onLogout}><LogOut size={18} /> Sign out</button>
          </div>
        </div>

        <section className="card">
          <div className="section__head">
            <h2>Saved addresses</h2>
            {!adding && addresses.data?.length < 5 && (
              <button type="button" className="btn btn--outline btn--sm" onClick={() => setAdding(true)}>
                <Plus size={16} /> Add address
              </button>
            )}
          </div>
          {addresses.loading && <Spinner label="Loading addresses..." />}
          {addresses.error && <ErrorState message={addresses.error} onRetry={addresses.reload} />}
          {addresses.data?.length === 0 && !adding && <p className="muted">No saved addresses yet. You can save one during checkout.</p>}
          <div className="address-grid">
            {addresses.data?.map((a) => (
              <div key={a._id} className="address card">
                <MapPin size={18} />
                <div>
                  <strong>{a.fullName}</strong>
                  <p>{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} - {a.pincode}<br />Phone: {a.phone}</p>
                </div>
                <button type="button" className="icon-btn" onClick={() => remove(a._id)} aria-label={`Delete address ${a.line1}`}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          {adding && (
            <form onSubmit={save} noValidate className="profile__form">
              <AddressForm values={form} errors={errors} onChange={setForm} idPrefix="profile" />
              <div className="form-actions">
                <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : 'Save address'}</button>
                <button type="button" className="btn btn--ghost" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
