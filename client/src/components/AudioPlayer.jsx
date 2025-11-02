import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, MoreHorizontal } from "lucide-react";

function AudioPlayer({ audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, "0")}`;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.pause() : audio.play();
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);
    if (progressRef.current)
      progressRef.current.style.width = `${
        (audio.currentTime / audio.duration) * 100
      }%`;
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    setCurrentTime(audio.currentTime);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updatePlayState = () => setIsPlaying(!audio.paused);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("play", updatePlayState);
    audio.addEventListener("pause", updatePlayState);
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", () =>
        setDuration(audio.duration)
      );
      audio.removeEventListener("play", updatePlayState);
      audio.removeEventListener("pause", updatePlayState);
      audio.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, []);

  if (!audioUrl) return null;

  return (
    <div className="mt-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="bg-black rounded-full flex items-center px-3 py-2">
        <button
          onClick={togglePlay}
          className="mr-3 p-1 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
        >
          {isPlaying ? (
            <Pause size={16} className="text-white" />
          ) : (
            <Play size={16} className="text-white" />
          )}
        </button>
        <span className="text-xs text-white mr-3 min-w-[4rem]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div className="flex-1 mx-3 relative h-1" onClick={handleSeek}>
          <div className="absolute inset-0 bg-gray-600 rounded-full cursor-pointer" />
          <div
            ref={progressRef}
            className="absolute inset-0 bg-white rounded-full transition-all duration-100"
            style={{ width: "0%" }}
          />
        </div>
        <button className="p-1 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors mr-2">
          <Volume2 size={16} className="text-white" />
        </button>
        <button className="p-1 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors">
          <MoreHorizontal size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

export default AudioPlayer;
