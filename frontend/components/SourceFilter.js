"use client";

export default function SourceFilter({ allSources, activeSources, onToggle }) {
  return (
    <div className="mb-6 flex gap-3 flex-wrap">
      <span className="text-sm font-medium text-gray-600 self-center">
        Sources:
      </span>
      {allSources.map((source) => {
        const isActive = activeSources.has(source);
        return (
          <button
            key={source}
            onClick={() => onToggle(source)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              isActive
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-400 border-gray-300"
            }`}
          >
            {source}
          </button>
        );
      })}
    </div>
  );
}