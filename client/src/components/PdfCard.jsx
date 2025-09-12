// import { Trash2, FileText, Eye } from "lucide-react";
// import { useState } from "react";

// function PdfCard({ metadata, onDelete, onView }) {
//   const [hovered, setHovered] = useState(false);

//   return (
//     <div
//       className="relative bg-gray-900 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 w-[280px] h-[240px] cursor-pointer"
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//     >
//       {/* PDF Icon Preview */}
//       <div className="flex items-center justify-center h-[140px] bg-gray-800">
//         <FileText className="w-14 h-14 text-red-500" />
//       </div>

//       {/* Metadata */}
//       <div className="p-4 flex flex-col justify-between h-[100px]">
//         <h2 className="text-lg font-semibold text-white truncate">
//           {metadata.title}
//         </h2>
//         <p className="text-sm text-gray-400 line-clamp-2">
//           {metadata.description}
//         </p>
//       </div>

//       {/* Hover Overlay */}
//       {hovered && (
//         <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col justify-center items-center space-y-4 rounded-xl transition-opacity duration-300">
//           {/* Top-right Delete button */}
//           <button
//             onClick={onDelete}
//             className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-md transition transform hover:scale-110"
//           >
//             <Trash2 size={18} />
//           </button>

//           {/* Center View button */}
//           <button
//             onClick={onView}
//             className="bg-white text-gray-900 p-3 rounded-full shadow-lg hover:scale-110 transition transform"
//           >
//             <Eye size={20} />
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default PdfCard;
import React from "react";
import { FileText } from "lucide-react"; // For the icon

// --- MOCK DATA ---
// Replace this with data fetched from your API.
// Your API should return a list of your Cloudinary PDFs.
// The `publicId` is the unique part of the URL after /upload/ (e.g., v123456/folder/doc.pdf)
const myPdfs = [
  {
    _id: "1",
    filename: "Why Language Models Hallucinate.pdf",
    publicId: "research_papers/language_models_hallucination.pdf", // Example public ID
  },
  {
    _id: "2",
    filename: "Academic Calendar.pdf",
    publicId: "university/academic_calendar_2025.pdf", // Example public ID
  },
  {
    _id: "3",
    filename: "DBMS Diagram Notes.pdf",
    publicId: "notes/dbms_diagram_notes.pdf", // Example public ID
  },
  {
    _id: "4",
    filename: "Semester Grade Card.pdf",
    publicId: "records/semester_grade_card_001.pdf", // Example public ID
  },
];

const PdfCard = ({ filename, publicId }) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; // Store your cloud name in .env

  // URL for the original PDF file
  const pdfUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;

  // URL for the generated thumbnail image
  const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/image/upload/pg_1,f_jpg,w_400,c_pad,h_550/${publicId}`;

  return (
    <a
      href={pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-[#1c1c1c] rounded-lg overflow-hidden shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-cyan-500/30"
    >
      {/* PDF Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={`Preview of ${filename}`}
        className="w-full h-96 object-cover object-top" // Adjust h-96 as needed
        loading="lazy"
      />

      {/* Card Footer */}
      <div className="p-4 flex items-center gap-3">
        <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <p
          className="text-sm font-semibold text-gray-200 truncate"
          title={filename}
        >
          {filename}
        </p>
      </div>
    </a>
  );
};

const PdfGrid = () => {
  // IMPORTANT: Replace this with your actual environment variable
  if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
    return (
      <div className="text-center p-8 bg-red-900/50 text-red-300 rounded-lg">
        <h2 className="text-xl font-bold">Configuration Error</h2>
        <p>Please set your VITE_CLOUDINARY_CLOUD_NAME in the .env file.</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">My Documents</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {myPdfs.map((pdf) => (
            <PdfCard
              key={pdf._id}
              filename={pdf.filename}
              publicId={pdf.publicId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PdfGrid;