import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { File, Youtube, Type, PlusCircle, Menu, Globe } from "lucide-react";

const iconMap = {
  youtube: <Youtube className="w-4 h-4 text-red-500 flex-shrink-0" />,
  pdf: <File className="w-4 h-4 text-blue-400 flex-shrink-0" />,
  text: <Type className="w-4 h-4 text-green-400 flex-shrink-0" />,
  web: <Globe className="w-4 h-4 text-white flex-shrink-0" />,
};

function Sidebar({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const response = await axios.get("/api/getData", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        toast.error("Could not load documents.");
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
    ...(data?.web || []),
  ];

  return (
    <aside
      className={`
        flex flex-col bg-[#1E1F20] text-gray-200 transition-all duration-300
        ${isOpen ? "w-72 p-4" : "w-0 p-0"}
      `}
    >
      <div className={`flex-1 overflow-hidden ${!isOpen && "hidden"}`}>
        <div className="flex items-center justify-between gap-2  mb-4">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-zinc-700"
          >
            <Menu size={20} />
          </button>

          <button
            onClick={() => navigate("/GetDocs")}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-zinc-700"
          >
            <PlusCircle size={20} />
          </button>
        </div>

        <div className="flex-1 pt-2 space-y-2 overflow-y-auto no-scrollbar">
          <h2 className="text-lg font-semibold flex-grow">Documents</h2>
          
          {loading && <p>Loading...</p>}
          {!loading && allDocs.length === 0 && (
            <p className="text-sm text-gray-500">No documents found.</p>
          )}
          {!loading &&
            allDocs.map((doc) => (
              <div
                key={doc._id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-700 cursor-pointer"
                onClick={() =>
                  toast.info(
                    `Navigating to ${doc.metadata?.title || "document"}`
                  )
                }
              >
                {iconMap[doc.type] || <File className="w-4 h-4" />}
                <span className="text-sm truncate">
                  {doc.metadata?.title || doc.metadata?.filename || "Untitled"}
                </span>
              </div>
            ))}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
