"use client";

export default function SourceFilter({ allSources, activeSources, onToggle }) {
  return (
    <div className="mb-6 flex gap-3 flex-wrap items-center">
      <span className="text-sm font-medium text-gray-600 self-center">Sources:</span>
      {allSources.map((source) => {
        const isActive = activeSources.has(source);
        return (
          <button
            key={source}
            onClick={() => onToggle(source)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200 ${
              isActive
                ? "bg-sky-600 text-white border-sky-600 shadow"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {source}
          </button>
        );
      })}
    </div>
  );
}