"use client";

export default function ClusterDetail({ detail, loading, activeSources, onClose }) {
  const filteredArticles = detail
    ? detail.articles.filter((a) => activeSources.has(a.source))
    : [];

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-semibold capitalize">
            {detail ? detail.label : "Loading..."}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {loading && <p className="text-gray-500">Loading articles...</p>}

        {!loading && detail && filteredArticles.length === 0 && (
          <p className="text-gray-500">
            No articles from currently active sources in this cluster.
          </p>
        )}

        {!loading && detail && filteredArticles.length > 0 && (
          <ul className="space-y-3">
            {filteredArticles.map((article) => (
              <li key={article.id} className="border-b border-gray-100 pb-3 last:border-0">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-600 hover:underline"
                >
                  {article.headline}
                </a>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 rounded-full">{article.source}</span>
                  <span className="text-xs">{new Date(article.published_at).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}