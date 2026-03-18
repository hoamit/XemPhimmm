'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertTriangle, Maximize, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { debugWarn } from '@/lib/debug';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  onEnded?: () => void;
  onError?: (error: unknown) => void;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function VideoPlayerInstance({ url, poster, onEnded, onError, onRetry }: VideoPlayerProps & { onRetry: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isError, setIsError] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [qualityLevels, setQualityLevels] = useState<{ index: number; label: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 is Auto
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    let hls: Hls | null = null;
    let didError = false;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => onEnded?.();
    const handleLoadedData = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleNativeError = (event: Event) => {
      didError = true;
      setIsError(true);
      setErrorDetails('Lỗi trình duyệt hoặc link hỏng');
      onError?.(event);
    };

    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
    }

    watchdogRef.current = setTimeout(() => {
      if (video.readyState < 3 && !didError) {
        didError = true;
        setIsError(true);
        setErrorDetails('Server phản hồi quá chậm');
        onError?.({ type: 'TIMEOUT' });
      }
    }, 15000);

    if (Hls.isSupported()) {
      hls = new Hls({
        capLevelToPlayerSize: true,
        autoStartLoad: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
      });

      hls.loadSource(url);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, async (_, data) => {
        setIsLoading(false);
        if (watchdogRef.current) {
          clearTimeout(watchdogRef.current);
        }

        const levels = data.levels.map((level, index) => ({
          index,
          label: level.name || `${level.height}p`,
        }));
        setQualityLevels([{ index: -1, label: 'Auto' }, ...levels]);

        try {
          await video.play();
        } catch (error) {
          if (!isAbortError(error)) {
            debugWarn('Auto-play blocked or interrupted', error);
          }
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (hls?.autoLevelEnabled) {
          setCurrentQuality(-1);
        } else {
          setCurrentQuality(data.level);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) {
          return;
        }

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls?.recoverMediaError();
            break;
          default:
            didError = true;
            setIsError(true);
            setErrorDetails(`Lỗi nguồn phát: ${data.details}`);
            onError?.(data);
            hls?.destroy();
            break;
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.load();
    } else {
      didError = true;
      queueMicrotask(() => {
        setIsError(true);
        setErrorDetails('Trình duyệt hiện tại không hỗ trợ nguồn phát này');
      });
      onError?.({ type: 'UNSUPPORTED_BROWSER' });
    }

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleNativeError);

    return () => {
      hls?.destroy();
      hlsRef.current = null;

      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
      }

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      video.pause();
      video.removeAttribute('src');
      video.load();

      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleNativeError);
    };
  }, [onEnded, onError, url]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (error) {
      if (!isAbortError(error)) {
        debugWarn('Playback error', error);
      }
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(event.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) {
      return;
    }

    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!videoRef.current) {
      return;
    }

    videoRef.current.volume = value;
    videoRef.current.muted = value === 0;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) {
      return;
    }

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void containerRef.current.requestFullscreen();
    }
  };
  
  const handleQualityChange = (index: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    
    hls.currentLevel = index;
    setCurrentQuality(index);
  };

  const handleMouseMove = () => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <video ref={videoRef} poster={poster} className="h-full w-full" playsInline />

      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-black/45 transition-opacity duration-300',
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        )}
        onClick={(e: React.MouseEvent) => {
          if (e.target === e.currentTarget) {
            void togglePlay();
          }
        }}
      >
        <div 
          className="flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4" 
          onClick={() => isPlaying && setShowControls(false)}
        >
          {/* Header area */}
        </div>

        <div 
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          onClick={() => {
            void togglePlay();
          }}
        >
          {isLoading && !isError ? (
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          ) : null}

          {isError ? (
            <div className="pointer-events-auto rounded-[1.7rem] border border-primary/20 bg-black/88 p-8 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/20">
                <AlertTriangle className="size-8 text-primary" />
              </div>
              <p className="text-xl font-black text-white">Ối! Lỗi nguồn phát</p>
              <p className="mx-auto mt-2 max-w-[240px] text-sm leading-6 text-white/55">
                {errorDetails || 'Không thể tải được phim, hãy thử đổi server khác.'}
              </p>
              <button type="button" onClick={onRetry} className="btn-primary mt-6 w-full py-2.5 text-sm">
                <RotateCcw className="size-4" />
                Tải lại nguồn
              </button>
            </div>
          ) : null}

          {!isPlaying && !isLoading && !isError ? (
            <button
              type="button"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                void togglePlay();
              }}
              className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/90 text-white shadow-[0_0_30px_rgba(215,25,45,0.55)] transition-transform duration-300 hover:scale-105"
            >
              <Play className="ml-1 size-10 fill-current" />
            </button>
          ) : null}
        </div>

        <div className="space-y-4 p-4 md:p-6">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="h-1 w-full cursor-pointer accent-primary transition-all duration-200 hover:h-2"
          />

          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <button type="button" onClick={() => void togglePlay()} className="text-white transition-colors hover:text-primary">
                {isPlaying ? <Pause className="size-7 fill-current" /> : <Play className="size-7 fill-current" />}
              </button>

              <div className="group/volume relative flex items-center gap-2">
                <button type="button" onClick={toggleMute} className="text-white transition-colors hover:text-primary">
                  {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="player-volume-slider h-1 w-0 accent-white transition-all duration-300 group-hover/volume:w-24"
                />
              </div>

              <div className="text-sm font-medium text-white/85">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {qualityLevels.length > 0 && (
                <select
                  value={currentQuality}
                  onChange={(e) => handleQualityChange(Number(e.target.value))}
                  className="cursor-pointer bg-transparent text-sm font-semibold text-white outline-none hover:text-primary transition-colors"
                >
                  {qualityLevels.map((level) => (
                    <option key={level.index} value={level.index} className="bg-secondary">
                      {level.label}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={playbackSpeed}
                onChange={(event) => {
                  const speed = Number(event.target.value);
                  setPlaybackSpeed(speed);
                  if (videoRef.current) {
                    videoRef.current.playbackRate = speed;
                  }
                }}
                className="cursor-pointer bg-transparent text-sm font-semibold text-white outline-none hover:text-primary transition-colors"
              >
                <option value="0.5" className="bg-secondary">0.5x</option>
                <option value="1" className="bg-secondary">1x</option>
                <option value="1.5" className="bg-secondary">1.5x</option>
                <option value="2" className="bg-secondary">2x</option>
              </select>

              <button type="button" onClick={toggleFullscreen} className="text-white transition-colors hover:text-primary">
                <Maximize className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <VideoPlayerInstance
      key={`${props.url}-${instanceKey}`}
      {...props}
      onRetry={() => setInstanceKey((value) => value + 1)}
    />
  );
};

export default VideoPlayer;
