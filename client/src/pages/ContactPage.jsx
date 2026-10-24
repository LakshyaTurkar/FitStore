import { useState } from 'react';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { SUPPORT_EMAIL } from '../utils/constants';

/**
 * The form does not pretend to submit to a server: it opens the visitor's
 * own email app with the message pre-filled (mailto:).
 */
export default function ContactPage() {
  useDocumentTitle('Contact Us');
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', subject: '', message: '' });
  const [errors, setErrors] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your name.';
    if (form.subject.trim().length < 3) next.subject = 'Please enter a subject.';
    if (form.message.trim().length < 10) next.message = 'Please write at least 10 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = `${form.message}\n\n- ${form.name}`;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <>
      <PageHeader eyebrow="Get in touch" title="Contact Us" subtitle="Questions about products, orders or returns? We're here to help." />
      <div className="container section two-col">
        <form className="card" onSubmit={submit} noValidate>
          <h2>Send us a message</h2>
          <p className="muted">This opens your email app with your message ready to send.</p>
          <FormField id="c-name" label="Your name" error={errors.name} required>
            <input id="c-name" value={form.name} onChange={set('name')} autoComplete="name" />
          </FormField>
          <FormField id="c-subject" label="Subject" error={errors.subject} required>
            <input id="c-subject" value={form.subject} onChange={set('subject')} placeholder="e.g. Order FS-251014-ABC123" />
          </FormField>
          <FormField id="c-message" label="Message" error={errors.message} required>
            <textarea id="c-message" rows={6} value={form.message} onChange={set('message')} />
          </FormField>
          <button type="submit" className="btn btn--primary"><Send size={18} /> Open email app</button>
        </form>
        <aside className="card contact-info">
          <h2>Contact details</h2>
          <ul>
            <li><Mail size={18} /> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
            <li><Phone size={18} /> +91 00000 00000 (demo number)</li>
            <li><MapPin size={18} /> India (online store)</li>
            <li><Clock size={18} /> Mon-Sat, 10:00 AM - 6:00 PM IST</li>
          </ul>
          <p className="muted">FitStore is a college demo project; contact details are placeholders.</p>
        </aside>
      </div>
    </>
  );
}
