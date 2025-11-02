import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Loader2,
  MessageSquare,
  FileText,
  Trash2,
  ShieldAlert,
  Globe,
} from "lucide-react";
import { toast } from "react-hot-toast";

import UploadDialog from "../components/uploadDialog";
import YoutubeCard from "../components/YoutubeCard";
import { RainbowButton } from "@/components/magicui/rainbow-button";



function GenericCard({ doc, onDelete, onView }) {
  // Determine media content
  let media;
  if (doc.type === "web") {
    media = (
      <img
        src={doc.image || "https://via.placeholder.com/300x180?text=Website"}
        alt={doc.title}
        className="w-full h-[160px] object-cover rounded-t-lg"
      />
    );
  } else if (doc.type === "pdf") {
    media = (
      <img
        src={doc.thumbnail}
        alt={doc.metadata.filename || doc.metadata.title}
        className="w-full h-[160px] object-cover rounded-t-lg"
      />
    );
  }

  // Determine icon
  // let icon = null;
  // if (doc.type === "text") icon = <FileText className="w-5 h-5 text-gray-400" />;
  // if (doc.type === "web") icon = <Globe className="w-4 h-4 text-gray-400" />;

  return (
    <div
      className="group relative bg-[#1c1c1c] rounded-lg overflow-hidden shadow-md h-[220px] cursor-pointer transition hover:shadow-lg"
      onClick={() => onView(doc)}
    >
      {media && <div className="h-[160px]">{media}</div>}

      <div className="p-2 flex flex-col justify-between h-[80px]">
        <h3
          className="text-md font-bold text-gray-100 truncate"
          title={doc.metadata?.title || doc.metadata?.filename || doc.title}
        >
          {doc.metadata?.title || doc.metadata?.filename || doc.title || "Untitled"}
        </h3>

        {doc.type === "text" && (
          <p className="text-sm text-gray-300 truncate">
            {doc.text  ? (doc.text.length > 100 ? doc.text.substring(0, 100) + "..." : doc.text) : "No preview available"}
          </p>
        )}

        {/* {icon && <div className="mt-1 flex items-center gap-1">{icon}</div>} */}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(doc._id, doc.type);
          }}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

function DocsGrid({ data, onDelete }) {
  const allDocs = [
    ...(data?.youtube || []).map((d) => ({ ...d, type: "youtube" })),
    ...(data?.pdf || []).map((d) => ({ ...d, type: "pdf" })),
    ...(data?.text || []).map((d) => ({ ...d, type: "text" })),
    ...(data?.web || []).map((d) => ({ ...d, type: "web" })),
  ];

  const handleView = (doc) => {
    if (doc.type === "web" && doc.url) {
      window.open(doc.url, "_blank", "noopener,noreferrer");
    }
    if (doc.type === "pdf") {
      // future: PDF viewer
    }
  };

  if (!allDocs.length) {
    return (
      <div className="flex-1 px-4 sm:px-6 lg:p-8">
        <div className="text-center text-gray-500">
          No documents uploaded yet. Click "Upload New Content" to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-6">
        {allDocs.map((doc) =>
          doc.type === "youtube" ? (
            <YoutubeCard
              key={doc._id}
              metadata={doc.metadata}
              link={doc.link}
              onDelete={() => onDelete(doc._id, doc.type)}
              onView={() => handleView(doc)}
            />
          ) : (
            <GenericCard key={doc._id} doc={doc} onDelete={onDelete} onView={handleView} />
          )
        )}
      </div>
    </div>
  );
}


function GetDocs() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState({ youtube: [], pdf: [], text: [], web: [] });
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("free");

  const fetchDocs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get("/api/getData", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { plan: userPlan, ...docsData } = response.data;
      setData(docsData || { youtube: [], pdf: [], text: [], web: [] });
      setPlan(userPlan || "free");
    } catch (err) {
      console.error("❌ Error fetching docs:", err);
      toast.error(err.response?.data?.error || "Failed to fetch documents.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (result) => {
    if (result.success) {
      toast.success(result.message);
      fetchDocs();
    } else {
      toast.error(result.error);
    }
  };

  const deleteDoc = async (mongoId, type) => {
    const promise = async () => {
      try {
        const token = await getToken();
        await axios.delete(`/api/deleteDocs`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { mongo_id: mongoId, type },
        });
        await fetchDocs();
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

  const allDocsCount =
    (data.youtube?.length || 0) +
    (data.pdf?.length || 0) +
    (data.text?.length || 0) +
    (data.web?.length || 0);

  const isLimitReached = plan === "free" && allDocsCount >= 3;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
      <div className="max-w-7xl mx-auto w-full flex-shrink-0 p-4 sm:p-6 lg:p-8">
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
              onClick={() => {
                if (allDocsCount > 0) navigate("/Chat");
              }}
            >
              <MessageSquare className="h-5 w-5 text-white" />
              Start Chat
            </RainbowButton>
          </div>
        </header>

        {isLimitReached && (
          <div className="flex items-center gap-3 text-center p-3 mb-4 bg-yellow-900/50 text-yellow-200 border border-yellow-700 rounded-lg">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              You've reached your 3-document limit. Please{" "}
              <a
                href="/pricing"
                className="font-bold underline hover:text-white"
              >
                upgrade your plan
              </a>{" "}
              to upload more.
            </p>
          </div>
        )}

        <UploadDialog
          onUploadComplete={handleUploadComplete}
          disabled={isLimitReached}
        />
      </div>

      <DocsGrid data={data} onDelete={deleteDoc} />
    </div>
  );
}

export default GetDocs;
