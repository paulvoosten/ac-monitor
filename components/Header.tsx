import { LegacyRef, useCallback, useEffect, useRef, useState } from 'react';

function formatTime(timeInSec: number) {
  const minutes = Math.floor(timeInSec / 60);
  const seconds = Math.floor(timeInSec % 60);
  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
}

// TODO: add volume management + styling
export default function Header({
  selectedFile,
}: {
  selectedFile: { name?: string; source?: string; type?: string };
}) {
  const audioRef: LegacyRef<HTMLAudioElement> = useRef(null);
  const rafRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const whilePlaying = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!audioRef.current.paused) {
        rafRef.current = requestAnimationFrame(() => whilePlaying());
      } else if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    }
  }, []);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play();
      rafRef.current = requestAnimationFrame(() => whilePlaying());
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, [selectedFile, whilePlaying]);

  return (
    <header>
      <div>
        <h1>AdCalls Soundboard</h1>
      </div>
      {selectedFile.source && (
        <div className="player">
          <span>{selectedFile.name}</span>
          {currentTime &&
            duration &&
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (audioRef.current) {
                if (audioRef.current.paused) {
                  audioRef.current.play();
                  rafRef.current = requestAnimationFrame(() => whilePlaying());
                } else {
                  audioRef.current.pause();
                  if (rafRef.current) {
                    cancelAnimationFrame(rafRef.current);
                  }
                }
              }
            }}
          >
            {audioRef.current && audioRef.current.paused ? 'Play' : 'Pause'}
          </button>
          <audio
            ref={audioRef}
            onLoadedMetadata={() => {
              audioRef.current && setDuration(audioRef.current.duration);
            }}
          >
            <source src={selectedFile.source} type={selectedFile.type} />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </header>
  );
}
