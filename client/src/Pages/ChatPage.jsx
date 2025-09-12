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
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { getToken } = useAuth();

  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;

    const newUserMessage = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const token = await getToken();
      const response = await axios.post(
        "/api/chat",
        { query: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const botResponse = response.data;
      const newBotMessage = {
        role: "ai",
        content: botResponse.answer,
        sources: botResponse.sources || [],
      };
      setMessages((prev) => [...prev, newBotMessage]);
    } catch (error) {
      console.error("API call failed:", error);
      const errorBotMessage = {
        role: "ai",
        content: "Sorry, something went wrong. Please try again.",
        sources: [],
      };
      setMessages((prev) => [...prev, errorBotMessage]);
      toast.error("Error communicating with the server.");
    } finally {
      setLoading(false);
    }
  };

  const hasStarted = messages.length > 0;

  return (
    <div className="flex h-screen w-full bg-[#131314] text-white">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col relative">
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
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatArea
            messages={messages}
            loading={loading}
            onSendMessage={handleSendMessage}
          />

          {/* If chat has started, render ChatBox at the very bottom */}
          {hasStarted && (
            <ChatBox onSendMessage={handleSendMessage} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
