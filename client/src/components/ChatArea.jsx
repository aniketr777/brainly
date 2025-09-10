import { useEffect, useRef } from "react";
import { Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import CodeBlockSimple from "../components/CodeBlockSimple";

function ChatArea({ messages, loading, webSearch, query }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      className="flex flex-col gap-3 p-4 w-full md:w-[46%]
                 h-[calc(100vh-130px)] md:fixed overflow-y-auto mx-auto
                  bg-black
                 rounded-2xl shadow-inner no-scrollbar"
    >
      {/* --- START: ADD THIS BLOCK FOR THE EMPTY STATE --- */}
      {messages.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
          {/* You can place your logo or an icon here */}
          <h2 className="text-2xl font-semibold">How can I help you today?</h2>
          <p className="mt-2 text-sm">Ask me anything to get started.</p>
        </div>
      )}
      {/* --- END: ADDED BLOCK --- */}

      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`group relative max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
            msg.role === "user"
              ? "bg-white text-black self-end"
              : "bg-black text-white self-start border border-gray-600"
          }`}
        >
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
    </div>
  );
}

export default ChatArea;
