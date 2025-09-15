import { useState } from "react";

function WebSearchResults({ results }) {
  const [visibleCount, setVisibleCount] = useState(3);

  if (!results || results.length === 0) return null;

  const handleShowMore = () => {
    setVisibleCount(results.length);
  };

  const displayResults = results.slice(0, visibleCount);

  return (
    <div className="w-full max-w-5xl mx-auto text-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-white">Sources</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayResults.map((src, idx) => (
          <div
            key={idx}
            className="p-3 gap-2 bg-[#1E1F20] rounded-lg hover:bg-[#2A2B2D] flex flex-col sm:flex-row-reverse items-start transition"
          >
            {/* Right side: text */}
            <div className="flex-1 pr-4">
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline font-medium line-clamp-2"
              >
                {src.title || src.url}
              </a>

              {src.snippet && (
                <p className="text-gray-400 text-sm mt-1 line-clamp-3">
                  {src.snippet}
                </p>
              )}
            </div>

            {/* Left side: image */}
            {src.image && (
              <img
                src={src.image}
                alt={src.title}
                className="mt-2 sm:mt-0 w-full sm:w-32 h-24 object-cover rounded-lg"
              />
            )}
          </div>
        ))}

        {/* Show More Card */}
        {visibleCount < results.length && (
          <div
            onClick={handleShowMore}
            className="cursor-pointer p-3 bg-[#1E1F20] rounded-lg hover:bg-[#2A2B2D] flex items-center justify-center text-blue-400 font-semibold text-center"
          >
            Show More
          </div>
        )}
      </div>
    </div>
  );
}

export default WebSearchResults;
