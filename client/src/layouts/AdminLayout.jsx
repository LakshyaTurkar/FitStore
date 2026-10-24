import { NavLink, Outlet } from 'react-router-dom';
import { Boxes, ClipboardList, LayoutDashboard, PlusCircle, Store } from 'lucide-react';
import Logo from '../components/Logo';
import DemoBanner from '../components/DemoBanner';

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <DemoBanner />
      <div className="admin">
        <aside className="admin__sidebar">
          <Logo to="/admin" light />
          <span className="admin__tag">Admin Panel</span>
          <nav aria-label="Admin">
            <NavLink to="/admin" end><LayoutDashboard size={18} /> Dashboard</NavLink>
            <NavLink to="/admin/products" end><Boxes size={18} /> Products</NavLink>
            <NavLink to="/admin/products/new"><PlusCircle size={18} /> Add Product</NavLink>
            <NavLink to="/admin/orders"><ClipboardList size={18} /> Orders</NavLink>
            <NavLink to="/"><Store size={18} /> View Store</NavLink>
          </nav>
        </aside>
        <main className="admin__main" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
