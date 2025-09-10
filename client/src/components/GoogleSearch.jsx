import { useState, useEffect } from "react";
import axios from "axios";
import { Video } from "lucide-react";

function Card({ result }) {
  return (
    <div className="bg-black w-full flex gap-3 h-[200px] p-3 border-b border-gray-800">
      <div className="w-1/3">
        <img
          src={result.thumbnail}
          alt={result.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1">
        <h4 className="text-white font-semibold">{result.title}</h4>
        <p className="text-gray-400 text-sm">{result.link}</p>
        <p className="text-gray-500 text-xs">{result.source}</p>
      </div>
    </div>
  );
}

function Question({ question }) {
  return (
    <div className="bg-black w-full p-3">
      <h3 className="text-white font-semibold mb-2">Related Questions</h3>
      <p className="text-gray-300">{question.question}</p>
    </div>
  );
}

function VideoCard({ video }) {
  return (
    <div className="bg-black w-full flex gap-3 h-[200px] p-3 border-b border-gray-800">
      <div className="w-1/3 relative">
        <img
          src={video.image}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <Video className="absolute top-2 right-2 text-white" size={24} />
      </div>
      <div className="flex-1">
        <h4 className="text-white font-semibold">{video.title}</h4>
        <p className="text-gray-400 text-sm">{video.link}</p>
        <p className="text-gray-500 text-xs">{video.channel}</p>
        <p className="text-gray-500 text-xs">{video.length}</p>
      </div>
    </div>
  );
}

function GoogleSearch({ query }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    console.log("query",query)
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post("/api/webSearch", {
          query,
        });
        setData(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch search results");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchData();
    }
  }, [query]);

  return (
    <div className="w-full bg-black text-white border-white rounded-md p-3">
      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}

      {data && (
        <>
          <div className="p-3">
            {data.organic_results?.map((result, index) => (
              <Card key={result.position || index} result={result} />
            ))}
          </div>
          <div className="p-3">
            {data.inline_videos?.map((video, index) => (
              <VideoCard key={video.position || index} video={video} />
            ))}
          </div>
          <div className="p-3">
            {data.related_questions?.map((question, index) => (
              <Question key={index} question={question} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default GoogleSearch;
