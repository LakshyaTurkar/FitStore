import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BadgeCheck, MessageSquare, Star } from 'lucide-react';
import { productApi } from '../api/endpoints';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RatingStars from './RatingStars';
import Pagination from './Pagination';
import { EmptyState, ErrorState, Spinner } from './Feedback';
import { formatDate } from '../utils/format';

export default function ReviewSection({ product, onReviewAdded }) {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const reviews = useApi(() => productApi.reviews(product._id, { page, limit: 5 }), [product._id, page]);
  const alreadyReviewed = user && reviews.data?.data.some((r) => String(r.user?._id) === String(user.id));

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (rating < 1) nextErrors.rating = 'Please choose a rating.';
    if (comment.trim().length < 10) nextErrors.comment = 'Please write at least 10 characters.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const res = await productApi.addReview(product._id, { rating, comment });
      toast.success(res.message);
      setRating(0);
      setComment('');
      setPage(1);
      reviews.reload();
      onReviewAdded?.();
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <div className="reviews__head">
        <h2 id="reviews-title">Customer Reviews</h2>
        <div className="reviews__summary">
          <strong>{product.rating.toFixed(1)}</strong>
          <RatingStars rating={product.rating} size={18} />
          <span>{product.numReviews} review{product.numReviews === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div className="reviews__grid">
        <div>
          {reviews.loading && <Spinner label="Loading reviews..." />}
          {reviews.error && <ErrorState message={reviews.error} onRetry={reviews.reload} />}
          {!reviews.loading && !reviews.error && reviews.data?.data.length === 0 && (
            <EmptyState icon={MessageSquare} title="No reviews yet" message="Be the first to share your experience." />
          )}
          <ul className="review-list">
            {reviews.data?.data.map((r) => (
              <li key={r._id} className="review card">
                <div className="review__meta">
                  <strong>{r.name}</strong>
                  <RatingStars rating={r.rating} />
                  {r.isDemo && <span className="badge badge--muted">Demo review</span>}
                  {r.verifiedPurchase && (
                    <span className="badge badge--success"><BadgeCheck size={13} /> Verified purchase</span>
                  )}
                </div>
                <p>{r.comment}</p>
                <time dateTime={r.createdAt}>{formatDate(r.createdAt)}</time>
              </li>
            ))}
          </ul>
          <Pagination page={page} pages={reviews.data?.pagination?.pages} onChange={setPage} />
        </div>

        <div className="card review-form">
          <h3>Write a review</h3>
          {!user && (
            <p>
              <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`}>Sign in with Google</Link> to review this product.
            </p>
          )}
          {user && alreadyReviewed && <p>You have already reviewed this product. Thank you!</p>}
          {user && !alreadyReviewed && (
            <form onSubmit={submit} noValidate>
              <fieldset className="star-input">
                <legend>Your rating</legend>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className={n <= rating ? 'is-on' : ''}>
                    <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} />
                    <Star size={26} aria-hidden="true" />
                    <span className="sr-only">{n} star{n > 1 ? 's' : ''}</span>
                  </label>
                ))}
              </fieldset>
              {errors.rating && <small className="field__error" role="alert">{errors.rating}</small>}
              <div className={`field ${errors.comment ? 'field--error' : ''}`}>
                <label htmlFor="review-comment">Your review</label>
                <textarea id="review-comment" rows={4} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
                <small className="field__hint">{comment.length}/1000</small>
                {errors.comment && <small className="field__error" role="alert">{errors.comment}</small>}
              </div>
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
