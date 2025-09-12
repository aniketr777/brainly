import { useState, useRef, useEffect } from "react";
import { Send, Plus } from "lucide-react";

function ChatBox({ onSendMessage, loading }) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim() || loading) return;
    onSendMessage(message);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    // --- THIS LINE IS CORRECTED ---
    <div className="w-full px-4 pb-4 max-w-3xl mx-auto">
      <div className="relative">
        <div className="flex items-end w-full p-2 bg-[#1E1F20] rounded-2xl shadow-lg border border-zinc-700">
          <button className="p-2 text-gray-400 hover:text-white">
            <Plus size={20} />
          </button>
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-white outline-none resize-none px-2 py-2 placeholder-gray-500 max-h-[200px] no-scrollbar"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            className="p-2 rounded-full bg-[#303134] text-white disabled:bg-zinc-600 disabled:text-gray-400 enabled:hover:bg-zinc-600"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;
