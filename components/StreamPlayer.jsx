'use client';

import { useState, useEffect, useRef } from 'react';
import { Maximize, RefreshCw, AlertCircle } from 'lucide-react';

export default function StreamPlayer({ streamUrl, channels, matchTitle, matchStatus }) {
  const isUpcoming = matchStatus === 'upcoming';
  const [activeChannel, setActiveChannel] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [streamStatus, setStreamStatus] = useState('loading');
  const [loadTimeout, setLoadTimeout] = useState(null);
  const iframeRef = useRef(null);
  const playerRef = useRef(null);

  const allChannels = channels && channels.length > 0 ? channels : [{ name: 'Stream 1', url: streamUrl, proxiedUrl: streamUrl }];
  const currentUrl = allChannels[activeChannel]?.proxiedUrl || allChannels[activeChannel]?.url || streamUrl;

  const handleLoad = () => {
    setIsLoading(false);
    setStreamStatus('active');
    if (loadTimeout) clearTimeout(loadTimeout);
  };

  const handleError = () => {
    setIsLoading(false);
    setStreamStatus('error');
    if (loadTimeout) clearTimeout(loadTimeout);
  };

  useEffect(() => {
    setIsLoading(true);
    setStreamStatus('loading');
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setStreamStatus('offline');
    }, 10000);
    setLoadTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [currentUrl]);

  const tryNextSource = () => {
    if (activeChannel < allChannels.length - 1) {
      setActiveChannel(prev => prev + 1);
    } else {
      setActiveChannel(0);
    }
  };

  const reloadStream = () => {
    setIsLoading(true);
    setStreamStatus('loading');
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const toggleFullscreen = () => {
    const el = playerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (el.requestFullscreen) {
      el.requestFullscreen();
    }
  };

  return (
    <div className="w-full">
      <div ref={playerRef} className="relative w-full overflow-hidden rounded-lg border border-border bg-zinc-900" style={{ aspectRatio: '16/9' }}>
        {isLoading && streamStatus !== 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-600 border-t-transparent" />
            <p className="mt-3 text-sm text-zinc-500">Connecting to stream...</p>
          </div>
        )}

        {streamStatus === 'error' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/95">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
              <AlertCircle className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-300">Stream failed to load</p>
            <p className="mt-1 text-xs text-zinc-500">The source may be offline or blocking embeds.</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={tryNextSource}
                className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Try Next Source
              </button>
              <button
                onClick={reloadStream}
                className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {streamStatus === 'offline' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/95">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
              <AlertCircle className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-300">Stream timed out</p>
            <p className="mt-1 text-xs text-zinc-500">Connection took too long. Try another source.</p>
            <button
              onClick={tryNextSource}
              className="mt-4 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Switch Source
            </button>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={currentUrl}
          className="absolute inset-0 h-full w-full"
          allowFullScreen
          allow="autoplay; fullscreen"
          onLoad={handleLoad}
          onError={handleError}
        />

        {isUpcoming && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/85">
            <p className="text-base font-semibold text-zinc-400">Match will start soon</p>
            <p className="mt-1 text-sm text-zinc-600">The stream will begin automatically</p>
          </div>
        )}

        <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
          <span className="rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-zinc-200">
            {matchTitle}
          </span>
          {streamStatus === 'active' && matchStatus === 'live' && (
            <span className="flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-green-400">
              Live
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5">
        <button
          onClick={reloadStream}
          className="rounded-md bg-zinc-900 p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          aria-label="Reload"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="rounded-md bg-zinc-900 p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          aria-label="Fullscreen"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>

      {allChannels.length > 1 && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-600 shrink-0">Servers</span>
          {allChannels.map((ch, idx) => (
            <button
              key={idx}
              onClick={() => { setActiveChannel(idx); }}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                activeChannel === idx
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-200'
                  : 'border-border bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
            >
              <span>{idx + 1}</span>
              <span className={`text-[10px] font-semibold uppercase ${ch.quality === 'HD' || ch.quality === 'FHD' || ch.quality === '1080p' ? 'text-green-500' : 'text-zinc-600'}`}>
                {ch.quality === 'FHD' || ch.quality === '1080p' ? 'HD' : (ch.quality || 'SD')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
