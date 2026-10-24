const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const formatINR = (amount) => inr.format(Number(amount) || 0);

export const formatDate = (value, withTime = false) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      })
    : '-';

export const effectivePrice = (product) =>
  product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price;

export const discountPercent = (product) =>
  product.discountPrice && product.discountPrice < product.price
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
