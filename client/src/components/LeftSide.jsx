import axios from "axios";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react"; // Clerk auth
import { File, Youtube, Type } from "lucide-react"; // Icons
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast"; 

function LeftSide() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setError("Authentication failed. Please log in again.");
          setLoading(false);
          toast.error("❌ Authentication failed. Please log in again."); // ✅ toast
          return;
        }

        const response = await axios.get("/api/getData", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setData(response.data);
        toast.success("✅ Documents loaded successfully!"); // ✅ toast
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        setError("Could not load documents.");
        toast.error("❌ Could not load documents."); // ✅ toast
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [getToken]);

  const allDocs = [
    ...(data?.youtube || []),
    ...(data?.pdf || []),
    ...(data?.text || []),
  ];

  if (loading) {
    return (
      <div className="w-full md:w-72 lg:w-80 h-full fixed p-4 bg-black border-r border-gray-800 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse h-6 bg-gray-700 rounded-md w-2/3"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full md:w-72 lg:w-80 h-full p-4 bg-black border-r border-gray-800 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full md:w-72 lg:w-80 h-full p-4 bg-black border-r  flex flex-col">
      {/* Header */}
      <div className="flex gap-3 items-center justify-between mb-4">
        <h2 className="text-md font-semibold text-white">Your Documents</h2>
        <button
          type="button"
          onClick={() => navigate("/GetDocs")}
          className="bg-white px-3 py-1 rounded-md text-black hover:bg-gray-200 transition text-sm"
        >
          Upload
        </button>
      </div>

      {/* Document List */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {allDocs.length > 0 ? (
          allDocs.map((doc) => (
            <div
              key={doc._id}
              className="flex items-center gap-2 p-2 rounded-md bg-black hover:bg-gray-900 cursor-pointer"
              onClick={() => {
                navigate(`/docs/${doc._id}`);
                toast.info(`📂 Opened "${doc.metadata?.title || "Untitled"}"`); // ✅ toast
              }}
            >
              {doc.type === "youtube" && (
                <Youtube className="w-4 h-4 text-red-500" />
              )}
              {doc.type === "pdf" && <File className="w-4 h-4 text-blue-400" />}
              {doc.type === "text" && (
                <Type className="w-4 h-4 text-green-400" />
              )}
              <span className="text-sm text-gray-200 truncate">
                {doc.metadata?.title ||
                  doc.metadata?.filename ||
                  doc.name ||
                  "Untitled"}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-2">
              No documents uploaded yet.
            </p>
            <button
              onClick={() => navigate("/GetDocs")}
              className="text-sm px-3 py-1 rounded-md bg-white text-black hover:bg-gray-200"
            >
              Upload Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeftSide;
