import { discountPercent, effectivePrice, formatINR } from '../utils/format';

export default function PriceTag({ product, large = false }) {
  const off = discountPercent(product);
  return (
    <div className={`price ${large ? 'price--large' : ''}`}>
      <span className="price__now">{formatINR(effectivePrice(product))}</span>
      {off > 0 && (
        <>
          <span className="price__mrp">
            <span className="sr-only">Original price </span>
            {formatINR(product.price)}
          </span>
          <span className="price__off">{off}% off</span>
        </>
      )}
    </div>
  );
}
