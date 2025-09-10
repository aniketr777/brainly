// 1. Import hooks and libraries for state and API calls
import { useState } from "react";
import { useAuth, UserButton, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import LeftSide from "@/components/LeftSide";
import ChatBox from "@/components/ChatBox";
import ChatArea from "@/components/ChatArea";
import RightSide from "@/components/RightSide";

const ChatPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  // 1. New state to hold the sources for the right sidebar
  const [currentSources, setCurrentSources] = useState([]);

  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;

    const newUserMessage = { role: "user", content: userMessage };
    setQuery(userMessage);
    setMessages((prev) => [...prev, newUserMessage]);
    setCurrentSources([]);
    setLoading(true);

    try {
      const token = await getToken();
      const response = await axios.post(
        "/api/chat",
        { query: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const botResponse = response.data;

      // 2. Update the sources state with the new response
      setCurrentSources(botResponse.sources || []);

      const newBotMessage = {
        role: "ai",
        content: botResponse.answer,
        sources: botResponse.sources,
      };
      setMessages((prev) => [...prev, newBotMessage]);
    } catch (error) {
      console.error("API call failed:", error);
      const errorBotMessage = {
        role: "ai",
        content: "Sorry, something went wrong.",
      };
      setMessages((prev) => [...prev, errorBotMessage]);
      toast.error("Error communicating with the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-gray-700 fixed bg-black  w-full">
      <div className="flex flex-col text-white">
        {/* Main content */}
        <div className="flex flex-col lg:flex-row w-full  p-3 gap-3 flex-1">
          {/* Left bar */}
          <div className="hidden lg:flex flex-col lg:w-[25%] bg-[rgb(33, 33, 33)] rounded-xl p-3">
            <div className="mb-4">
              <img src="/logo.svg" alt="logo" className="w-[100px]" />
            </div>
            <LeftSide></LeftSide>
          </div>

          {/* Chat section */}
          <div className="flex flex-col h-screen lg:w-[50%]">
            {/* Chat messages area */}
            <div className="flex-1 overflow-y-auto p-4">
              <ChatArea messages={messages} loading={loading}  />
            </div>

            {/* Chat input box (fixed at bottom) */}
            <div className="border-t border-gray-700 bg-black p-3 ">
              <ChatBox onSendMessage={handleSendMessage} />
            </div>
          </div>

          {/* Right bar */}
          <div className="hidden lg:flex flex-col lg:w-[25%] bg-[rgb(33, 33, 33)] rounded-xl p-3">
            <div className="flex justify-end w-full mb-4">
              {user ? (
                <UserButton
                  afterSignOut={() => navigate("/")}
                  appearance={{ elements: { userButtonBox: "bg-gray-900" } }}
                />
              ) : null}
            </div>

            <RightSide data={{ sources: currentSources }} loading={loading} query={query} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
