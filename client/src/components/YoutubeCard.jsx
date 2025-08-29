import { Trash2, Eye } from "lucide-react";
import { useState } from "react";

function YoutubeCard({ metadata, link, onDelete, onView }) {
  const [hovered, setHovered] = useState(false);
  const videoId = function extractVideoId(link) {
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    let match = link.match(/v=([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    // Shortened URL: https://youtu.be/VIDEO_ID
    match = link.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    return null;
  };
  const [vidId, setVidId] = useState(videoId(link));
  return (
    <div
      className="relative p-3 rounded-lg transition hover:shadow-lg hover:shadow-black/50 w-[280px] h-[220px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover Overlay */}
      {hovered && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg">
          {/* Delete button (top-right) */}
          <button
            onClick={onDelete}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition"
          >
            <Trash2 size={18} />
          </button>

          {/* View button (center) */}
          <div className="flex items-center justify-center w-full h-full">
            <button
              onClick={onView}
              className="bg-black text-white p-3 rounded-full shadow hover:scale-110 transition"
            >
              <Eye size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Video Frame */}
      <div className="rounded-md overflow-hidden w-full h-[158px]">
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${vidId}?start=60&loop=1&playlist=${vidId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>

      {/* Metadata */}
      <h2 className="text-base font-bold mt-2 truncate">{metadata.title}</h2>
      <p className="text-xs text-gray-400 line-clamp-2">
        {metadata.description}
      </p>
    </div>
  );
}

export default YoutubeCard;
