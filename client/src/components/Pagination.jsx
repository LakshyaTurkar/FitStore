import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const numbers = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i += 1) numbers.push(i);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft size={18} />
      </button>
      {numbers.map((n) => (
        <button
          type="button"
          key={n}
          onClick={() => onChange(n)}
          className={n === page ? 'is-active' : ''}
          aria-current={n === page ? 'page' : undefined}
        >
          {n}
        </button>
      ))}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page">
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
