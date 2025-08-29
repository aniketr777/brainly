import { useEffect, useRef } from "react";
import { Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import CodeBlockSimple from "../components/CodeBlockSimple";

function ChatArea({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // toast.success("Text Copied");
  };

  return (
    <div
      className="flex flex-col gap-3 p-4 w-full
                 h-[calc(100vh-150px)] mx-auto
                 overflow-y-auto bg-black
                 rounded-2xl shadow-inner no-scrollbar"
    >
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`group relative max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
            msg.role === "user"
              ? "bg-white text-black self-end"
              : "bg-black text-white self-start border border-gray-600"
          }`}
        >
          {/* --- THIS IS THE CORRECTED LINE --- */}
          <div
            className={`prose max-w-none ${
              msg.role === "user" ? "" : "prose-invert"
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlockSimple,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>

          {/* Your copy button is untouched and will work as before */}
          {msg.role === "ai" && (
            <button
              onClick={() => copyToClipboard(msg.content)}
              className="absolute -bottom-5 left-5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      ))}
      {loading && (
        <div className="bg-black text-white self-start border border-gray-600 max-w-[70%] px-4 py-2 rounded-2xl text-sm">
          Thinking...
        </div>
      )}
      <div ref={bottomRef} /> {/* scroll target */}
    </div>
  );
}

export default ChatArea;
