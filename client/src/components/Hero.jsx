
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FluidCursor from "./FluidCursor";
import { useClerk, useUser } from "@clerk/clerk-react";
const Hero = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const { isSignedIn } = useUser();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const handleGetStarted = () => {
    if(isSignedIn){
      navigate("/GetDocs");
    } else {
      openSignIn();
    }
  }
  return (
    <div>
      <FluidCursor />
      <section className="bg-black text-white w-full">
        <div className="container mx-auto flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <motion.div
            className="flex flex-col items-center gap-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Main Headline */}
            <motion.h1
              className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400"
              variants={itemVariants}
            >
              Your Second Brain,
              <br />
              Instantly Searchable
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              className="max-w-xl text-lg text-neutral-400"
              variants={itemVariants}
            >
              Just upload a PDF, paste a YouTube link, or add text to create an
              instant chatbot for your knowledge.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center gap-4 mt-4"
              variants={itemVariants}
            >
              {/* Free Sign Up → Goes to /GetDocs */}
              <Button
                onClick={() => handleGetStarted()}
                size="lg"
                className="bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20 transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                Get Started for Free
              </Button>

              {/* Premium Upgrade */}
              <Button
                size="lg"
                variant="outline"
                className="border-violet-600 text-violet-400 hover:bg-violet-600 hover:text-white transition-colors"
              >
                Upgrade to Premium
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
