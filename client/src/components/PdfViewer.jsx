import { useState, useEffect } from "react";
import axios from "axios";

function PdfViewer({ id, onClose }) {
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const res = await axios.get(`/api/docs/${id}`);
        setFileUrl(res.data.fileUrl); // backend should send { fileUrl }
      } catch (err) {
        console.error("Error fetching PDF:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPdf();
  }, [id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[95%] md:w-[80%] lg:w-[70%] h-[90%] flex flex-col relative">
        {/* Header with Close Button */}
        <div className="flex justify-between items-center p-3 border-b">
          <h2 className="text-lg font-semibold">📄 PDF Viewer</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            Close ✖
          </button>
        </div>

        {/* PDF Display */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <p className="p-4 text-center">Loading PDF...</p>
          ) : fileUrl ? (
            <embed
              src={fileUrl}
              type="application/pdf"
              width="100%"
              height="100%"
              className="rounded-b-lg"
            />
          ) : (
            <p className="p-4 text-center text-red-500">PDF not found ❌</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PdfViewer;
