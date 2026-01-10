import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const AnswerMessage = ({ node, inline, className, children, ...props }) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";

  const handleCopy = () => {
    const codeToCopy = String(children).replace(/\n+$/, "");
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  // Handle inline code
  if (inline) return <code className="text-blue-300">{children}</code>;

  // Detect links
  const highlightLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) =>
      urlRegex.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300"
        >
          {part}
        </a>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  if (language === "text") {
    const cleanedText = String(children)
      // Remove accidental Markdown code fences
      .replace(/```+/g, "")
      // Limit excessive blank lines
      .replace(/\n{3,}/g, "\n\n")
      // Remove spaces before punctuation
      .replace(/\s+([.,!?;:])/g, "$1")
      .trim();

    return (
      <pre className="whitespace-pre-wrap leading-relaxed font-mono text-sm text-white bg-[#1e1f20] p-3 rounded-md">
        <code>{highlightLinks(cleanedText)}</code>
      </pre>
    );
  }

  // For code blocks
  return (
    <div className="relative my-4 rounded-lg bg-[#282c34] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-1.5 bg-black rounded-t-lg">
        <span className="text-xs font-sans text-white">{language}</span>
        <button
          onClick={handleCopy}
          className="px-2 py-1 text-xs font-thin text-white bg-black rounded-md focus:outline-none"
        >
          {isCopied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n+$/, "")}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default AnswerMessage;
