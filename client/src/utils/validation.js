/** Mirrors the server's address rules for instant feedback. The server re-validates everything. */
export function validateAddressForm(values) {
  const errors = {};
  const phone = (values.phone || '').replace(/[\s-]/g, '').replace(/^\+91/, '');
  if (!values.fullName || values.fullName.trim().length < 2) errors.fullName = 'Please enter your full name.';
  if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  if (!values.line1 || values.line1.trim().length < 5) errors.line1 = 'Please enter your street address (min 5 characters).';
  if (!values.city || values.city.trim().length < 2) errors.city = 'Please enter your city.';
  if (!values.state) errors.state = 'Please select your state.';
  if (!/^[1-9]\d{5}$/.test((values.pincode || '').trim())) errors.pincode = 'Enter a valid 6-digit PIN code.';
  return errors;
}

export const EMPTY_ADDRESS = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };
