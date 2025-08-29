import { Trash2, FileText, Eye } from "lucide-react";
import { useState } from "react";

function PdfCard({ metadata, onDelete, onView }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative bg-gray-900 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 w-[280px] h-[240px] cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* PDF Icon Preview */}
      <div className="flex items-center justify-center h-[140px] bg-gray-800">
        <FileText className="w-14 h-14 text-red-500" />
      </div>

      {/* Metadata */}
      <div className="p-4 flex flex-col justify-between h-[100px]">
        <h2 className="text-lg font-semibold text-white truncate">
          {metadata.title}
        </h2>
        <p className="text-sm text-gray-400 line-clamp-2">
          {metadata.description}
        </p>
      </div>

      {/* Hover Overlay */}
      {hovered && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col justify-center items-center space-y-4 rounded-xl transition-opacity duration-300">
          {/* Top-right Delete button */}
          <button
            onClick={onDelete}
            className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-md transition transform hover:scale-110"
          >
            <Trash2 size={18} />
          </button>

          {/* Center View button */}
          <button
            onClick={onView}
            className="bg-white text-gray-900 p-3 rounded-full shadow-lg hover:scale-110 transition transform"
          >
            <Eye size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export default PdfCard;
