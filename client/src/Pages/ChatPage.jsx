import { useCallback, useState } from "react";
import { useAuth, UserButton } from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";
import { Menu } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import ChatBox from "@/components/ChatBox";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { getToken } = useAuth();
  const [searchType, setSearchType] = useState("Doc Search");

  const addMessage = (message) =>
    setMessages((prev) => [...prev, message]);

  const handleDocSearch = async (query, token) => {
    const { data } = await axios.post(
      "/api/chat",
      { query },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      role: "ai",
      searchType: "Doc Search",
      content: data.answer || "No answer found.",
      sources: data.sources || [],
    };
  };

  const handleWebSearch = async (query, token) => {
    const { data } = await axios.post(
      "/api/webSearch",
      { query },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      role: "ai",
      searchType: "Web Search",
      content: data.answer || "No summary available.",
      results: data.citations || data.sources || [],
    };
  };

  const handleSendMessage = async (userMessage, selectedSearchType) => {
    if (!userMessage.trim()) {
      toast.error("Please enter a question to get started.");
      return;
    }

    const mode = selectedSearchType || searchType;

    if (!mode) {
      toast.error("Select a search type before sending a message.");
      return;
    }

    addMessage({ role: "user", content: userMessage });
    setLoading(true);

    try {
      const token = await getToken();
      const aiMessage =
        mode === "Web Search"
          ? await handleWebSearch(userMessage, token)
          : await handleDocSearch(userMessage, token);

      addMessage(aiMessage);
      toast.success(
        mode === "Web Search"
          ? "Web results summarized."
          : "Document answer generated."
      );
    } catch (err) {
      console.error("API call failed:", err);
      toast.error("Error communicating with the server.");
      addMessage({
        role: "ai",
        content: "⚠️ Something went wrong. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTypeChange = useCallback(
    (type) => {
      if (!type || type === searchType) return;
      setSearchType(type);
      toast.success(`${type} enabled`);
    },
    [searchType]
  );

  const hasStarted = messages.length > 0;

  return (
    <div className="flex h-screen w-full bg-[#131314] text-white">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col relative">
        {/* Topbar */}
        <header className="flex items-center p-4 bg-[#131314] h-[60px] border-b border-zinc-700">
          {!isSidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-300 hover:text-white"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex-grow" />
          <UserButton afterSignOutUrl="/" />
        </header>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatArea
            messages={messages}
            loading={loading}
            onSendMessage={handleSendMessage}
            setSearchType={handleSearchTypeChange}
          />

          {hasStarted && (
            <ChatBox
              onSendMessage={handleSendMessage}
              loading={loading}
              setSearchType={handleSearchTypeChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
