import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className={`logo ${light ? 'logo--light' : ''}`} aria-label="FitStore home">
      <span className="logo__mark" aria-hidden="true">
        <Dumbbell size={20} strokeWidth={2.5} />
      </span>
      <span className="logo__text">
        FIT<span>STORE</span>
      </span>
    </Link>
  );
}
