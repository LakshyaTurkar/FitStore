import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ImageOff, Save } from 'lucide-react';
import { productApi, storeApi } from '../../api/endpoints';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../context/ToastContext';
import FormField from '../../components/FormField';
import { ErrorState, Spinner } from '../../components/Feedback';

const EMPTY = { name: '', description: '', category: '', brand: 'FitStore', price: '', discountPrice: '', image: '', stock: '', sku: '', featured: false };

function validate(v) {
  const e = {};
  if (v.name.trim().length < 3) e.name = 'Name must be at least 3 characters.';
  if (v.description.trim().length < 20) e.description = 'Description must be at least 20 characters.';
  if (!v.category) e.category = 'Choose a category.';
  if (!(Number(v.price) > 0)) e.price = 'Enter a price greater than 0.';
  if (v.discountPrice !== '' && !(Number(v.discountPrice) > 0 && Number(v.discountPrice) < Number(v.price))) e.discountPrice = 'Discount price must be lower than the price.';
  if (!/^https?:\/\/.+/.test(v.image.trim())) e.image = 'Enter a valid image URL (https://...).';
  if (!Number.isInteger(Number(v.stock)) || Number(v.stock) < 0 || v.stock === '') e.stock = 'Stock must be a whole number (0 or more).';
  if (!/^[A-Za-z0-9-]{3,30}$/.test(v.sku.trim())) e.sku = 'SKU: 3-30 letters, numbers or hyphens.';
  return e;
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Edit Product' : 'Add Product');
  const navigate = useNavigate();
  const toast = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  const categories = useApi(() => storeApi.categories().then((r) => r.data), []);
  const product = useApi(() => (isEdit ? productApi.get(id).then((r) => r.data.product) : Promise.resolve(null)), [id]);

  useEffect(() => {
    if (product.data) {
      const p = product.data;
      setValues({
        name: p.name,
        description: p.description,
        category: p.category?._id || '',
        brand: p.brand || '',
        price: String(p.price),
        discountPrice: p.discountPrice ? String(p.discountPrice) : '',
        image: p.image,
        stock: String(p.stock),
        sku: p.sku,
        featured: p.featured,
      });
    }
  }, [product.data]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (key === 'image') setImgError(false);
    setValues((v) => ({ ...v, [key]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    const payload = {
      ...values,
      price: Number(values.price),
      discountPrice: values.discountPrice === '' ? null : Number(values.discountPrice),
      stock: Number(values.stock),
    };
    setSaving(true);
    try {
      const res = isEdit ? await productApi.update(id, payload) : await productApi.create(payload);
      toast.success(res.message);
      navigate('/admin/products');
    } catch (err) {
      if (err.details) setErrors(err.details);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (product.loading || categories.loading) return <Spinner label="Loading..." />;
  if (product.error) return <ErrorState message={product.error} onRetry={product.reload} />;

  const field = (key, label, input, extra = {}) => (
    <FormField id={`pf-${key}`} label={label} error={errors[key]} required={extra.required} hint={extra.hint}>
      {input}
    </FormField>
  );

  return (
    <div className="admin-page">
      <div className="admin-page__head admin-page__head--row">
        <h1>{isEdit ? 'Edit product' : 'Add product'}</h1>
        <Link to="/admin/products" className="btn btn--ghost">&larr; Back to products</Link>
      </div>

      <form className="product-form" onSubmit={submit} noValidate>
        <div className="card form-grid">
          {field('name', 'Product name', <input id="pf-name" value={values.name} onChange={set('name')} maxLength={120} />, { required: true })}
          {field('brand', 'Brand', <input id="pf-brand" value={values.brand} onChange={set('brand')} maxLength={60} />)}
          {field('category', 'Category', (
            <select id="pf-category" value={values.category} onChange={set('category')}>
              <option value="">Select category</option>
              {categories.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          ), { required: true })}
          {field('sku', 'SKU', <input id="pf-sku" value={values.sku} onChange={set('sku')} maxLength={30} />, { required: true, hint: 'Unique code, e.g. GE-DB-HEX-05' })}
          {field('price', 'Price / MRP (INR)', <input id="pf-price" type="number" min="1" step="1" value={values.price} onChange={set('price')} />, { required: true })}
          {field('discountPrice', 'Discount price (INR)', <input id="pf-discountPrice" type="number" min="1" step="1" value={values.discountPrice} onChange={set('discountPrice')} />, { hint: 'Leave empty for no discount' })}
          {field('stock', 'Stock quantity', <input id="pf-stock" type="number" min="0" step="1" value={values.stock} onChange={set('stock')} />, { required: true })}
          {field('image', 'Image URL', <input id="pf-image" type="url" value={values.image} onChange={set('image')} placeholder="https://images.unsplash.com/..." />, { required: true })}
          <div className="form-grid__full">
            {field('description', 'Description', <textarea id="pf-description" rows={5} value={values.description} onChange={set('description')} maxLength={3000} />, { required: true })}
          </div>
          <label className="checkbox form-grid__full">
            <input type="checkbox" checked={values.featured} onChange={set('featured')} /> Show as featured product on the homepage
          </label>
        </div>

        <aside className="card product-form__preview">
          <h2>Image preview</h2>
          {values.image && !imgError ? (
            <img src={values.image} alt="Product preview" onError={() => setImgError(true)} />
          ) : (
            <div className="preview-empty"><ImageOff size={32} /> {imgError ? 'Image could not be loaded' : 'No image URL yet'}</div>
          )}
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create product'}
          </button>
        </aside>
      </form>
    </div>
  );
}
