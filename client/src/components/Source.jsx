// src/components/Source.jsx

import { File, Youtube, Type, Link as LinkIcon } from "lucide-react";
import { toast } from "react-hot-toast";

const iconMap = {
  pdf: <File size={14} className="text-blue-400" />,
  youtube: <Youtube size={14} className="text-red-500" />,
  text: <Type size={14} className="text-green-400" />,
};

function Source({ source, index }) {
  const title = source.title || source.filename || "Untitled Source";
  // Check for a link property to determine if it's a clickable source
  const isLink = source.link && source.link.startsWith("http");

  const content = (
    <>
      <span className="bg-zinc-700 w-5 h-5 flex items-center justify-center rounded-full text-white text-[10px] font-bold">
        {index}
      </span>
      {iconMap[source.type] || <LinkIcon size={14} />}
      <span className="truncate max-w-[200px]">{title}</span>
    </>
  );

  const className =
    "flex items-center gap-2 bg-[#303134] hover:bg-zinc-600 cursor-pointer px-3 py-1 rounded-full text-xs text-gray-300 transition-colors";

  // If it's a link, render an anchor tag
  if (isLink) {
    return (
      <a
        href={source.link}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={title}
      >
        {content}
      </a>
    );
  }

  // Otherwise, render a div with a toast message onClick
  return (
    <div
      onClick={() => toast.info(`Source: ${title}`)}
      className={className}
      title={title}
    >
      {content}
    </div>
  );
}

export default Source;
