import FormField from './FormField';
import { INDIAN_STATES } from '../utils/constants';

/** Controlled address fields shared by Checkout and Profile. */
export default function AddressForm({ values, errors = {}, onChange, idPrefix = 'addr' }) {
  const set = (key) => (e) => onChange({ ...values, [key]: e.target.value });
  const fid = (key) => `${idPrefix}-${key}`;
  const aria = (key) => (errors[key] ? { 'aria-invalid': true, 'aria-describedby': `${fid(key)}-error` } : {});

  return (
    <div className="form-grid">
      <FormField id={fid('fullName')} label="Full name" error={errors.fullName} required>
        <input id={fid('fullName')} value={values.fullName} onChange={set('fullName')} autoComplete="name" maxLength={80} {...aria('fullName')} />
      </FormField>
      <FormField id={fid('phone')} label="Mobile number" error={errors.phone} hint="10-digit Indian mobile number" required>
        <input id={fid('phone')} type="tel" inputMode="numeric" value={values.phone} onChange={set('phone')} autoComplete="tel-national" maxLength={14} {...aria('phone')} />
      </FormField>
      <FormField id={fid('line1')} label="Address (house no., street, area)" error={errors.line1} required>
        <input id={fid('line1')} value={values.line1} onChange={set('line1')} autoComplete="address-line1" maxLength={150} {...aria('line1')} />
      </FormField>
      <FormField id={fid('line2')} label="Landmark / Address line 2" error={errors.line2}>
        <input id={fid('line2')} value={values.line2} onChange={set('line2')} autoComplete="address-line2" maxLength={150} />
      </FormField>
      <FormField id={fid('city')} label="City" error={errors.city} required>
        <input id={fid('city')} value={values.city} onChange={set('city')} autoComplete="address-level2" maxLength={60} {...aria('city')} />
      </FormField>
      <FormField id={fid('state')} label="State" error={errors.state} required>
        <select id={fid('state')} value={values.state} onChange={set('state')} autoComplete="address-level1" {...aria('state')}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </FormField>
      <FormField id={fid('pincode')} label="PIN code" error={errors.pincode} required>
        <input id={fid('pincode')} inputMode="numeric" value={values.pincode} onChange={set('pincode')} autoComplete="postal-code" maxLength={6} {...aria('pincode')} />
      </FormField>
    </div>
  );
}
