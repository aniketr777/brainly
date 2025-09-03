
import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";


// The component now accepts a function `onSendMessage` as a prop.
function ChatBox({ onSendMessage }) {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "20px"; // reset to min height
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px"; // cap at 200px
    }
  }, [message]);

  // The API call logic is removed from here.
  const handleSend = () => {
    if (!message.trim()) return;

    // It now calls the function passed from the parent component.
    onSendMessage(message);

    setMessage("");
  };

  const handleAddDocs = () => {
    console.log("Add documents clicked");
  };

  // -----------------------------------------------------------
  // --- THE UI BELOW IS EXACTLY THE SAME AS YOUR ORIGINAL CODE ---
  // -----------------------------------------------------------
  return (
    <div className="fixed bottom-0   left-0 w-full bg-black p-4">
      <div
        className="mx-auto flex items-end rounded-3xl px-3 py-2 
                  bg-black border  shadow-xl 
                  w-full max-w-3xl"
      >
        {/* + Button on the left */}
        <button
          onClick={handleAddDocs}
          className="mr-2 flex items-center justify-center rounded-md p-2 text-white"
        >
          <Plus onClick={() => navigate("/GetDocs")} className="text-md" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 resize-none bg-transparent text-white outline-none px-2 py-2 max-h-[200px] overflow-y-auto"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          className="ml-2 rounded-full bg-white text-black px-3 py-2"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
