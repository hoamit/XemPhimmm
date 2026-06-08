'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertTriangle, Maximize, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { debugWarn } from '@/lib/debug';
import { cn } from '@/lib/utils';

const SeekBackward10: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <text
      x="12"
      y="15"
      fontSize="8"
      fontWeight="900"
      fontFamily="system-ui, sans-serif"
      textAnchor="middle"
      fill="currentColor"
      stroke="none"
    >
      10
    </text>
  </svg>
);

const SeekForward10: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <text
      x="12"
      y="15"
      fontSize="8"
      fontWeight="900"
      fontFamily="system-ui, sans-serif"
      textAnchor="middle"
      fill="currentColor"
      stroke="none"
    >
      10
    </text>
  </svg>
);

interface VideoPlayerProps {
  url: string;
  poster?: string;
  onEnded?: () => void;
  onError?: (error: unknown) => void;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function isHlsUrl(value: string) {
  return /\.m3u8($|\?)/i.test(value);
}

function resolvePlayableUrl(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }

  if (isHlsUrl(normalized)) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    const nestedUrl = parsed.searchParams.get('url') || parsed.searchParams.get('source') || '';
    if (nestedUrl && isHlsUrl(nestedUrl)) {
      return nestedUrl;
    }
  } catch {
    return normalized;
  }

  return normalized;
}

function VideoPlayerInstance({ url, poster, onEnded, onError, onRetry }: VideoPlayerProps & { onRetry: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVolumeRef = useRef(1);

  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isError, setIsError] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const hlsRef = useRef<Hls | null>(null);
  const playableUrl = useMemo(() => resolvePlayableUrl(url), [url]);
  const hasSourceError = !playableUrl;

  useEffect(() => {
    if (!hasSourceError) {
      return;
    }

    onError?.({ type: 'EMPTY_SOURCE' });
  }, [hasSourceError, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (hasSourceError) {
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

    if (Hls.isSupported() && isHlsUrl(playableUrl)) {
      hls = new Hls({
        capLevelToPlayerSize: true,
        autoStartLoad: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
      });

      hls.loadSource(playableUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        setIsLoading(false);
        if (watchdogRef.current) {
          clearTimeout(watchdogRef.current);
        }

        try {
          await video.play();
        } catch (error) {
          if (!isAbortError(error)) {
            debugWarn('Auto-play blocked or interrupted', error);
          }
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
    } else if (isHlsUrl(playableUrl) && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playableUrl;
      video.load();
    } else if (!isHlsUrl(playableUrl)) {
      video.src = playableUrl;
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
  }, [hasSourceError, onEnded, onError, playableUrl]);

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

  const handleSeekBy = (offsetInSeconds: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(duration) || duration <= 0) {
      return;
    }

    const nextTime = Math.min(Math.max(video.currentTime + offsetInSeconds, 0), duration);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const toggleMute = () => {
    if (!videoRef.current) {
      return;
    }

    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      const restoredVolume = lastVolumeRef.current > 0 ? lastVolumeRef.current : 0.8;
      videoRef.current.volume = restoredVolume;
      setVolume(restoredVolume);
    }
    setIsMuted(nextMuted);
  };

  const setVideoVolume = (nextVolume: number) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const clampedVolume = Math.min(Math.max(nextVolume, 0), 1);
    const nextMuted = clampedVolume === 0;

    video.volume = clampedVolume;
    video.muted = nextMuted;

    if (clampedVolume > 0) {
      lastVolumeRef.current = clampedVolume;
    }

    setVolume(clampedVolume);
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVideoVolume(Number(event.target.value));
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

  const triggerShowControls = () => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlayingRef.current) {
        setShowControls(false);
      }
    }, 3500);
  };

  const handleMouseMove = () => {
    triggerShowControls();
  };

  const handlePlayerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target) {
      const tagName = target.tagName.toLowerCase();
      if (target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return;
      }
    }

    switch (event.key) {
      case ' ':
      case 'k':
      case 'K':
        event.preventDefault();
        void togglePlay();
        setShowControls(true);
        break;
      case 'ArrowLeft':
      case 'j':
      case 'J':
        event.preventDefault();
        handleSeekBy(-10);
        setShowControls(true);
        break;
      case 'ArrowRight':
      case 'l':
      case 'L':
        event.preventDefault();
        handleSeekBy(10);
        setShowControls(true);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setVideoVolume((isMuted ? 0 : volume) + 0.05);
        setShowControls(true);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setVideoVolume((isMuted ? 0 : volume) - 0.05);
        setShowControls(true);
        break;
      case 'm':
      case 'M':
        event.preventDefault();
        toggleMute();
        setShowControls(true);
        break;
      case 'f':
      case 'F':
        event.preventDefault();
        toggleFullscreen();
        setShowControls(true);
        break;
      default:
        break;
    }
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
      className="group relative aspect-video w-full overflow-hidden bg-black focus:outline-none"
      onMouseMove={handleMouseMove}
      onMouseDown={() => containerRef.current?.focus()}
      onKeyDown={handlePlayerKeyDown}
      tabIndex={0}
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
            if (showControls) {
              setShowControls(false);
              if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
              }
            } else {
              triggerShowControls();
            }
          }
        }}
      >
        <div 
          className="flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4" 
          onClick={(e) => {
            e.stopPropagation();
            if (isPlaying) setShowControls(false);
          }}
        >
          {/* Header area */}
        </div>

        <div 
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          {isLoading && !isError && !hasSourceError ? (
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          ) : null}

          {isError || hasSourceError ? (
            <div className="pointer-events-auto rounded-[1.7rem] border border-primary/20 bg-black/88 p-8 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/20">
                <AlertTriangle className="size-8 text-primary" />
              </div>
              <p className="text-xl font-black text-white">Ối! Lỗi nguồn phát</p>
              <p className="mx-auto mt-2 max-w-[240px] text-sm leading-6 text-white/55">
                {hasSourceError
                  ? 'Không tìm thấy nguồn phát hợp lệ.'
                  : errorDetails || 'Không thể tải được phim, hãy thử đổi server khác.'}
              </p>
              <button type="button" onClick={onRetry} className="btn-primary mt-6 w-full py-2.5 text-sm">
                <RotateCcw className="size-4" />
                Tải lại nguồn
              </button>
            </div>
          ) : null}

          {(!isPlaying || showControls) && !isLoading && !isError ? (
            <button
              type="button"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                void togglePlay();
                triggerShowControls();
              }}
              className="pointer-events-auto flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-primary/90 text-white shadow-[0_0_30px_rgba(215,25,45,0.55)] transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <Pause className="size-8 md:size-10 fill-current text-white" />
              ) : (
                <Play className="ml-1 size-8 md:size-10 fill-current text-white" />
              )}
            </button>
          ) : null}
        </div>

        <div className="space-y-3 p-3 md:p-6" onClick={(e) => e.stopPropagation()}>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="h-1 w-full cursor-pointer accent-primary transition-all duration-200 hover:h-2"
          />

          <div className="flex items-center justify-between gap-1.5 sm:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    void togglePlay();
                    triggerShowControls();
                  }}
                  className="text-white transition-colors hover:text-primary p-2 rounded-full hover:bg-white/10 active:bg-white/20"
                >
                  {isPlaying ? <Pause className="size-5 sm:size-6 fill-current" /> : <Play className="size-5 sm:size-6 fill-current" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSeekBy(-10);
                    triggerShowControls();
                  }}
                  className="text-white transition-colors hover:text-primary p-2 rounded-full hover:bg-white/10 active:bg-white/20"
                  aria-label="Tua lùi 10 giây"
                >
                  <SeekBackward10 className="size-5 sm:size-6" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSeekBy(10);
                    triggerShowControls();
                  }}
                  className="text-white transition-colors hover:text-primary p-2 rounded-full hover:bg-white/10 active:bg-white/20"
                  aria-label="Tua tới 10 giây"
                >
                  <SeekForward10 className="size-5 sm:size-6" />
                </button>

                <div className="group/volume relative flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      toggleMute();
                      triggerShowControls();
                    }}
                    className="text-white transition-colors hover:text-primary p-2 rounded-full hover:bg-white/10 active:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="size-5 sm:size-6" /> : <Volume2 className="size-5 sm:size-6" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="player-volume-slider hidden md:block h-1 w-14 cursor-pointer accent-white transition-all duration-300 group-hover/volume:w-24"
                    aria-label="Âm lượng"
                  />
                </div>

              <div className="text-[11px] sm:text-xs font-semibold text-white/80 ml-1 select-none">
                {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <select
                value={playbackSpeed}
                onChange={(event) => {
                  const speed = Number(event.target.value);
                  setPlaybackSpeed(speed);
                  if (videoRef.current) {
                    videoRef.current.playbackRate = speed;
                  }
                  triggerShowControls();
                }}
                className="cursor-pointer bg-transparent text-xs sm:text-sm font-semibold text-white outline-none hover:text-primary transition-colors py-1 px-1.5 rounded hover:bg-white/10"
              >
                <option value="0.5" className="bg-secondary">0.5x</option>
                <option value="1" className="bg-secondary">1x</option>
                <option value="1.5" className="bg-secondary">1.5x</option>
                <option value="2" className="bg-secondary">2x</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  toggleFullscreen();
                  triggerShowControls();
                }}
                className="text-white transition-colors hover:text-primary p-2 rounded-full hover:bg-white/10 active:bg-white/20"
              >
                <Maximize className="size-5 sm:size-6" />
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
