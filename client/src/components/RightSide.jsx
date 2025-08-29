import React from "react";
import { FileText, Type, Youtube } from "lucide-react"; // Added Youtube icon

// --- Reusable Card Components (with styling) ---

function PdfCard({ filename }) {
  return (
    <div className="bg-[#1c1c1c] p-3 rounded-lg flex items-center gap-3">
      <FileText className="w-6 h-6 text-blue-400 flex-shrink-0" />
      <p
        className="text-sm font-semibold truncate text-gray-200"
        title={filename}
      >
        {filename}
      </p>
    </div>
  );
}

function TextCard({ title }) {
  return (
    <div className="bg-[#1c1c1c] p-3 rounded-lg flex items-center gap-3">
      <Type className="w-6 h-6 text-green-400 flex-shrink-0" />
      <p className="text-sm font-semibold truncate text-gray-200" title={title}>
        {title}
      </p>
    </div>
  );
}

// Simple, new card for YouTube sources
function SimpleYoutubeCard({ title }) {
  return (
    <div className="bg-[#1c1c1c] p-3 rounded-lg flex items-center gap-3">
      <Youtube className="w-6 h-6 text-red-500 flex-shrink-0" />
      <p className="text-sm font-semibold truncate text-gray-200" title={title}>
        {title}
      </p>
    </div>
  );
}

// --- Main RightSide Component ---

function RightSide({ data, loading }) {
  const sources = data?.sources || [];

  // 1. Create a Set of seen IDs and filter the sources array
  const seenIds = new Set();
  const uniqueSources = sources.filter((source) => {
    // Use mongoId as the unique identifier
    const duplicate = seenIds.has(source.mongoId);
    seenIds.add(source.mongoId);
    return !duplicate;
  });

  return (
    <div className="w-full flex flex-col p-4 space-y-4 h-auto overflow-y-auto no-scrollbar">
      <h2 className="text-xl font-bold text-white mb-2">Sources</h2>

      {loading && <p className="text-gray-400">Loading sources...</p>}

      {!loading && uniqueSources.length === 0 && (
        <p className="text-gray-500">No sources were found for this answer.</p>
      )}

      {!loading &&
        uniqueSources.length > 0 &&
        // 2. Map over the 'uniqueSources' array
        uniqueSources.map((source) => {
          const key = source.mongoId;

          // 3. Use if/else statements to check for properties instead of just 'type'
          if (source.type === "pdf") {
            return <PdfCard key={key} filename={source.filename} />;
          } else if (source.type === "text") {
            return <TextCard key={key} title={source.title} />;
          } else if (source.link) {
            // Check for a 'link' property to identify YouTube sources
            return <SimpleYoutubeCard key={key} title={source.title} />;
          } else {
            // Gracefully handle any other types by not rendering them
            return null;
          }
        })}
    </div>
  );
}

export default RightSide;
