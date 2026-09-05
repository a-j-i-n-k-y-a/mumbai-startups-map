import Explorer from '@/components/Explorer';
import { loadDataset } from '@/lib/data';

/** Re-read the JSON per request so a fresh ingest shows up without a restart. */
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { companies, generatedAt, caveats } = await loadDataset();

  return (
    <main className="app">
      <header className="app__header">
        <div className="app__brand">
          <h1 className="app__title">Mumbai Startup Map</h1>
          <p className="app__subtitle">
            {companies.length} companies
            {generatedAt ? ` · updated ${generatedAt.slice(0, 10)}` : ''}
          </p>
        </div>
        <a className="app__submit" href="https://github.com/a-j-i-n-k-y-a/mumbai-startups-map/issues/new">
          Submit / correct a company
        </a>
      </header>

      {caveats.length > 0 ? (
        <details className="caveats">
          <summary className="caveats__summary">
            Read this before trusting the pins — {caveats.length} known limitations
          </summary>
          <ul className="caveats__list">
            {caveats.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </details>
      ) : null}

      <Explorer companies={companies} />
    </main>
  );
}
