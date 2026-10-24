/** Accessible label + input + error message. */
export default function FormField({ id, label, error, hint, required, children }) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="field__req" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <small className="field__hint">{hint}</small>}
      {error && (
        <small className="field__error" id={`${id}-error`} role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
