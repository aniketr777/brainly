import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const CodeBlockSimple = ({ node, inline, className, children, ...props }) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";

  const handleCopy = () => {
    const codeToCopy = String(children).replace(/\n$/, "");
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  // --- THIS IS THE CORRECTED PART ---
  if (inline) {
    // Let the parent 'prose' class handle the styling for a more natural look
    return <code>{children}</code>;
  }

  if (language === "text") {
    return (
      <pre className="whitespace-pre-wrap font-sans text-white">
        <code>{children}</code>
      </pre>
    );
  }

  // Render the full code block for any other language
  return (
    <div className="relative my-4 rounded-lg bg-[#282c34]">
      <div className="flex items-center justify-between px-4 py-1.5 bg-black rounded-t-lg">
        <span className="text-xs font-sans text-white">{language}</span>
        <button
          onClick={handleCopy}
          className="px-2 py-1 text-xs font-thin text-white bg-black rounded-md focus:outline-none"
        >
          {isCopied ? "Copied!" : "Copy "}
        </button>
      </div>

      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlockSimple;


