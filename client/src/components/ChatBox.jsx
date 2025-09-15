import { useState, useRef, useEffect } from "react";
import { Send, Plus, Mic, X } from "lucide-react";

function ChatBox({ onSendMessage, loading, setSearchType }) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");

  const options = ["Web Search", "Doc Search"];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        80
      )}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim() || loading) return;
    onSendMessage(message, selectedType);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelect = (opt) => {
    setSelectedType(opt);
    setSearchType(opt);
    setOpen(false);
  };

  return (
    <div className="w-full px-4 pb-4 max-w-3xl mx-auto">
      <div className="relative">
        {/* Dropdown popup */}
        {open && (
          <div className="absolute bottom-14 left-2 bg-[#2A2B2D] border border-zinc-600 rounded-lg shadow-lg w-32">
            {options.map((opt) => (
              <div
                key={opt}
                onClick={() => handleSelect(opt)}
                className="px-3 py-2 cursor-pointer text-white hover:bg-zinc-700 rounded-md"
              >
                {opt}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 w-full px-3 py-2 bg-[#1E1F20] border border-zinc-700 rounded-2xl shadow-md">
          {/* Plus button */}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <Plus size={20} />
          </button>

          {/* Selected type pill */}
          {selectedType && (
            <div className="flex items-center gap-1 bg-zinc-800 text-white text-xs px-2 py-1 rounded-full shrink-0">
              {selectedType}
              <button
                onClick={() => setSelectedType("")}
                className="text-gray-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input / textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything"
            className="flex-1 bg-transparent text-white outline-none resize-none placeholder-gray-500 max-h-[120px] no-scrollbar text-sm"
            disabled={loading}
          />

          {/* Right buttons */}
          {message.trim() ? (
            <button
              onClick={handleSend}
              disabled={!message.trim() || loading}
              className="p-2 rounded-full bg-white text-black hover:bg-gray-200 disabled:bg-zinc-600 disabled:text-gray-400 shrink-0"
            >
              <Send size={16} />
            </button>
          ) : (
            <button className="p-2 text-gray-400 hover:text-white shrink-0">
              <Mic size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatBox;
