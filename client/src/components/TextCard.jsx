import { Trash2, Eye } from "lucide-react";
import { useState } from "react";

function TextCard({ metadata, content, onDelete, onView }) {
  const [hovered, setHovered] = useState(false);

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

      {/* Text Preview */}
      <div className="flex items-center justify-center w-full h-[158px] bg-neutral-800 rounded-md p-3 overflow-hidden">
        <p className="text-sm text-gray-200 line-clamp-5">{content}</p>
      </div>

      {/* Metadata */}
      <h2 className="text-base font-bold mt-2 truncate">{metadata.title}</h2>
    </div>
  );
}

export default TextCard;
