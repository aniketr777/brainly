import { Trash2, Eye } from "lucide-react";
import { useState } from "react";

function YoutubeCard({ metadata, link, onDelete, onView }) {
  const [hovered, setHovered] = useState(false);
  const videoId = function extractVideoId(link) {
    
    let match = link.match(/v=([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    match = link.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];

    return null;
  };
  const [vidId, setVidId] = useState(videoId(link));
  return (
    <div
      className="group relative bg-[#1c1c1c] rounded-lg overflow-hidden shadow-md h-[220px] transition hover:shadow-lg cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Media */}
      <div className="w-full h-[160px] rounded-md overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${vidId}?start=60&loop=1&playlist=${vidId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>

      {/* Title */}
      <div className="p-2">
        <h3
          className="text-sm font-bold text-gray-100 truncate"
          title={metadata.title}
        >
          {metadata.title || "Untitled"}
        </h3>
      </div>

      {/* Hover overlay */}
      {hovered && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={onView}
            className="bg-white/10 text-white p-3 rounded-full shadow hover:scale-110 transition"
          >
            <Eye size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export default YoutubeCard;
