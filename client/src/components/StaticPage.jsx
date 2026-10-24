import PageHeader from './PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function StaticPage({ title, subtitle, eyebrow, updated, children }) {
  useDocumentTitle(title);
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} eyebrow={eyebrow} />
      <div className="container section">
        <article className="prose card">
          {updated && <p className="muted">Last updated: {updated}</p>}
          {children}
        </article>
      </div>
    </>
  );
}
