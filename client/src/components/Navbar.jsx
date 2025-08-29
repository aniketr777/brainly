import { useNavigate } from "react-router-dom";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { openSignIn } = useClerk();

  return (
    <nav className="fixed top-0 z-50 w-full backdrop-blur-2xl bg-black/80 text-white flex justify-between items-center py-3 px-4 sm:px-20 cxl:px-32 shadow-md">
      {/* Logo */}
      <div
        className="flex items-center cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img src="/logo.png" alt="Logo" className="w-28 h-8" />
      </div>

      {/* Right side */}
      <div>
        {user ? (
          <UserButton
            afterSignOut={() => navigate("/")}
            appearance={{ elements: { userButtonBox: "bg-gray-900" } }}
          />
        ) : (
          <button
            onClick={openSignIn}
            className="flex items-center gap-2 rounded-full text-sm cursor-pointer bg-white text-black px-6 py-2.5 font-semibold hover:bg-gray-200 transition-colors"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
