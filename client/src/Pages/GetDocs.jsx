
import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import { Loader2, MessageSquare, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import UploadDialog from "../components/uploadDialog";
import YoutubeCard from "../components/YoutubeCard";
import { RainbowButton } from "@/components/magicui/rainbow-button";

// Set Axios base URL
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

// Child Component: DocsGrid
function DocsGrid({ data, onDelete }) {
  const allDocs = [
    ...(data?.youtube || []).map((doc) => ({ ...doc, type: "youtube" })),
    ...(data?.pdf || []).map((doc) => ({ ...doc, type: "pdf" })),
    ...(data?.text || []).map((doc) => ({ ...doc, type: "text" })),
  ];

  const handleView = (doc) => {
    if (doc.type === "pdf") {
      toast.info("Viewing for PDFs can be implemented here.");
      return;
    }
    window.open(doc.link || doc.filepath, "_blank");
  };

  if (!allDocs.length) {
    return (
      <div className="flex-1 px-4 sm:px-6 lg:p-8">
        <div className="text-center text-gray-500">
          <p>
            No documents uploaded yet. Click "Upload New Content" to get
            started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-6">
        {allDocs.map((doc) => {
          if (doc.type === "youtube") {
            return (
              <YoutubeCard
                key={doc._id}
                metadata={{
                  title: doc.metadata.title,
                  description: doc.metadata.description,
                }}
                link={doc.link}
                onDelete={() => onDelete(doc._id, doc.type)}
                onView={() => handleView(doc)}
              />
            );
          }
          if (doc.type === "pdf" || doc.type === "text") {
            return (
              <div
                key={doc._id}
                className="group relative bg-[#1c1c1c] p-4 rounded-lg flex flex-col justify-between h-[220px]"
              >
                <div className="flex flex-col items-center text-center">
                  <FileText className="w-16 h-16 mx-auto text-gray-500 mb-2" />
                  <p
                    className="text-sm font-semibold truncate w-full text-gray-200"
                    title={doc.metadata.filename || doc.metadata.title}
                  >
                    {doc.metadata.filename || doc.metadata.title}
                  </p>
                </div>
                {/* Hover Overlay for PDF/Text */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => onDelete(doc._id, doc.type)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

// Parent Component: GetDocs
function GetDocs() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate(); // Hook is now correctly initialized

  const [data, setData] = useState({ youtube: [], pdf: [], text: [] });
  const [loading, setLoading] = useState(true);

  // Fetch documents function
  const fetchDocs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get("/api/getData", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data || { youtube: [], pdf: [], text: [] });
    } catch (err) {
      console.error("❌ Error fetching docs:", err);
      toast.error(err.response?.data?.error || "Failed to fetch documents.");
    } finally {
      setLoading(false);
    }
  };

  // Delete document function
  const deleteDoc = async (mongoId, type) => {
    const promise = async () => {
      try {
        const token = await getToken();
        await axios.delete(`/api/deleteDocs`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { mongo_id: mongoId, type: type },
        });
        await fetchDocs(); // Refresh the document list
      } catch (err) {
        console.error("❌ Error deleting document:", err);
        throw new Error(
          err.response?.data?.error || "Failed to delete document."
        );
      }
    };

    toast.promise(promise(), {
      loading: "Deleting document...",
      success: "Document deleted successfully! ✅",
      error: (err) => err.message,
    });
  };

  useEffect(() => {
    fetchDocs();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const allDocsCount =
    (data.youtube?.length || 0) +
    (data.pdf?.length || 0) +
    (data.text?.length || 0);

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <div className="max-w-7xl mx-auto w-full flex-shrink-0 p-4 sm:p-6 lg:p-8">
        {/* HEADER + TOP NAV */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Upload Documents
          </h1>
          <div className="w-full sm:w-auto flex gap-3">
            <RainbowButton
              disabled={allDocsCount === 0}
              className={`flex items-center gap-2 font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ${
                allDocsCount === 0
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
              // 👇 FIX: The whole button now handles navigation
              onClick={() => {
                if (allDocsCount > 0) {
                  navigate("/Chat");
                }
              }}
            >
              {/* 👇 FIX: No onClick needed here anymore */}
              <MessageSquare className="h-5 w-5 text-white" />
              Start Chat
            </RainbowButton>
          </div>
        </header>

        {/* UPLOAD DIALOG */}
        <UploadDialog onUploadSuccess={fetchDocs} />
      </div>

      {/* DOCUMENT GRID */}
      <DocsGrid data={data} onDelete={deleteDoc} />
    </div>
  );
}

export default GetDocs;