import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Copy } from "lucide-react";
import { toast } from "react-hot-toast";

import CodeBlockSimple from "./CodeBlockSimple";
import Source from "./Source";
import ChatBox from "./ChatBox";

function ChatArea({ messages, loading, onSendMessage }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const hasStarted = messages.length > 0;

  return (
    <div
      className={`w-full ${
        hasStarted
          ? "flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar"
          : "h-full flex flex-col items-center justify-center p-4"
      }`}
    >
      {!hasStarted && !loading && (
        <>
          <div className="flex flex-col items-center text-center text-gray-400 mb-8">
            <Sparkles className="w-16 h-16 mb-4 text-gray-500" />
            <h1 className="text-4xl font-semibold text-gray-300">
              How can I help you today?
            </h1>
          </div>
          <ChatBox onSendMessage={onSendMessage} loading={loading} />
        </>
      )}

      {hasStarted &&
        messages.map((msg, idx) => {
          const uniqueSources =
            msg.role === "ai" && msg.sources
              ? Array.from(
                  new Map(
                    msg.sources.map((item) => [item.mongoId, item])
                  ).values()
                )
              : [];

          return (
            <div
              key={idx}
              className={`flex flex-col gap-3 max-w-3xl mx-auto w-full group ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`relative px-4 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-[#303134] text-white self-end"
                    : "bg-[#1E1F20] text-gray-200 self-start"
                }`}
              >
                <div className="prose prose-invert max-w-none prose-p:my-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{ code: CodeBlockSimple }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.role === "ai" && (
                  <button
                    onClick={() => handleCopy(msg.content)}
                    className="absolute top-2 right-2 p-1.5 rounded-md text-gray-400 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-700 hover:text-white"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>

              {uniqueSources.length > 0 && (
                <div className="flex flex-wrap gap-2 self-start mt-1">
                  {uniqueSources.map((source, index) => (
                    <Source
                      key={source.mongoId || index}
                      source={source}
                      index={index + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

      {loading && (
        <div className="flex max-w-3xl mx-auto w-full items-start">
          <div className="bg-[#1E1F20] text-gray-200 px-4 py-3 rounded-2xl">
            Thinking...
          </div>
        </div>
      )}

      <div ref={scrollRef} />
    </div>
  );
}

export default ChatArea;
