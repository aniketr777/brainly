import { useState } from "react";
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

  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;

    const newUserMessage = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const token = await getToken();

      if (searchType === "Doc Search") {
        const { data } = await axios.post(
          "/api/chat",
          { query: userMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            searchType,
            content: data.answer || "No answer found.",
            sources: data.sources || [],
          },
        ]);
      } else {
        // --- THIS BLOCK IS NOW CORRECTED ---
        const { data } = await axios.post(
          "/api/webSearch",
          { query: userMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            searchType,
            content: data.answer || "No summary available.",
            results: data.citations || data.sources || [],
          },
        ]);
        // console.log("Answer from API:",answer);
        // console.log("Citations from API:", citations);
        // --- END OF CORRECTION ---
      }
    } catch (err) {
      console.error("API call failed:", err);
      toast.error("Error communicating with the server.");
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "⚠️ Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

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
            setSearchType={setSearchType}
          />

          {hasStarted && (
            <ChatBox
              onSendMessage={handleSendMessage}
              loading={loading}
              setSearchType={setSearchType}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
