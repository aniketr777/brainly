import React from "react";

const reviews = [
  {
    name: "Alex Morgan",
    username: "@alex_morgan",
    body: "This tool is a game-changer. I uploaded a 200-page research PDF and got the exact data I needed in seconds. It saved me hours of manual searching.",
    img: "https://avatar.vercel.sh/alex",
  },
  {
    name: "Samantha Lee",
    username: "@samanthalee",
    body: "I used to spend my weekends summarizing lecture videos. Now, I just paste the YouTube link and get a perfect summary. My study workflow has been completely transformed.",
    img: "https://avatar.vercel.sh/samantha",
  },
  {
    name: "David Chen",
    username: "@davidchen",
    body: "Incredible. I fed it a mix of text notes and a dense legal document, and it answered my questions flawlessly. It's like having a personal research assistant.",
    img: "https://avatar.vercel.sh/david",
  },
  {
    name: "Priya Sharma",
    username: "@priyasharma",
    body: "The ability to cross-reference information between a video and a PDF is just brilliant. This has become my go-to tool for content analysis.",
    img: "https://avatar.vercel.sh/priya",
  },
  {
    name: "Ben Carter",
    username: "@bencarter",
    body: "As a student, this is indispensable. It helps me find key arguments in academic papers and videos without getting bogged down in the details. Absolutely love it.",
    img: "https://avatar.vercel.sh/ben",
  },
  {
    name: "Olivia Martinez",
    username: "@oliviam",
    body: "I was skeptical at first, but the accuracy of the answers is stunning. It understands context from complex documents better than any other tool I've tried.",
    img: "https://avatar.vercel.sh/olivia",
  },
];

function Testimonial() {
  return (
    <div className="bg-black w-full h-[80vh] p-8 flex flex-col gap-12 z-2 overflow-hidden">
      {/* Row 1 - Left to Right */}
      <div className="overflow-hidden">
        <div className="flex gap-8 animate-marquee">
          {[...reviews, ...reviews].map((review, index) => (
            <div
              key={`row1-${index}`}
              className="bg-black border  text-white p-6 rounded-lg flex-shrink-0 w-96"
            >
              <div className="flex items-center mb-4">
                <img
                  src={review.img}
                  alt={review.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <div className="font-bold">{review.name}</div>
                  <div className="text-neutral-400 text-sm">
                    {review.username}
                  </div>
                </div>
              </div>
              <div className="text-sm text-neutral-300">{review.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2 - Right to Left */}
      <div className="overflow-hidden">
        <div className="flex gap-8 animate-marquee-reverse">
          {[...reviews, ...reviews].map((review, index) => (
            <div
              key={`row2-${index}`}
              className="bg-black border text-white p-6 rounded-lg flex-shrink-0 w-96"
            >
              <div className="flex items-center mb-4">
                <img
                  src={review.img}
                  alt={review.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <div className="font-bold">{review.name}</div>
                  <div className="text-neutral-400 text-sm">
                    {review.username}
                  </div>
                </div>
              </div>
              <div className="text-sm text-neutral-300">{review.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tailwind CSS Animations */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee-reverse {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 40s linear infinite;
        }
        .animate-marquee-reverse {
          display: flex;
          width: max-content;
          animation: marquee-reverse 40s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default Testimonial;
