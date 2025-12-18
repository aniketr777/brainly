import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FluidCursor from "./FluidCursor";
import { useClerk, useUser } from "@clerk/clerk-react";

const galleryImages = [
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80",
];

const Hero = () => {
  const navigate = useNavigate();
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
    if (isSignedIn) {
      navigate("/GetDocs");
    } else {
      openSignIn();
    }
  };

  return (
    <div className="relative overflow-hidden bg-black">
      <FluidCursor />
      <div className="absolute -left-20 -top-24 w-96 h-96 bg-purple-600/20 blur-[120px]" />
      <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/15 blur-[120px]" />

      <section className="text-white w-full relative">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center min-h-[80vh] px-6 pt-20">
          <motion.div
            className="flex flex-col gap-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              className="inline-flex items-center w-fit gap-2 text-xs uppercase tracking-[0.22em] px-3 py-1 rounded-full border border-white/20 bg-white/5 text-zinc-200"
              variants={itemVariants}
            >
              Document chat • Web answers • Audio replies
            </motion.span>

            <motion.h1
              className="text-5xl md:text-6xl font-bold leading-tight tracking-tight"
              variants={itemVariants}
            >
              A more beautiful way
              <br />
              to talk with your knowledge
            </motion.h1>

            <motion.p
              className="text-lg text-neutral-300 max-w-xl"
              variants={itemVariants}
            >
              Upload PDFs, save links, and keep your questions in one place. Brainly turns every
              conversation into a saved, searchable notebook you can return to on any device.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row items-center gap-4" variants={itemVariants}>
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20 transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                Start chatting for free
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                See how it works
              </Button>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left"
              variants={itemVariants}
            >
              {["Saved history", "Source citations", "Real-time web"].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-200">
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="relative"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-purple-900/30"
              variants={itemVariants}
            >
              <div className="grid grid-cols-1 gap-4">
                {galleryImages.map((src, index) => (
                  <div
                    key={src}
                    className={`rounded-2xl overflow-hidden border border-white/10 bg-black/40 ${
                      index === 0 ? "h-40" : "h-32"
                    }`}
                  >
                    <img
                      src={src}
                      alt="Product preview"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-white/10 text-sm text-zinc-100">
                Beautiful chat threads, saved replies, and shareable citations—ready for the next
                question.
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
