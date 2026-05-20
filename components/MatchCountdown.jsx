'use client';

import { useState, useEffect } from 'react';

export default function MatchCountdown({ timestamp, status }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const diff = timestamp - Date.now();
      if (diff <= 0) {
        setTimeLeft('Starting soon');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      else setTimeLeft(`${minutes}m ${seconds}s`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timeLeft || status === 'live') return null;

  return (
    <div className="rounded-lg border border-border bg-zinc-900/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">Kickoff in</span>
        <span className="text-lg font-mono font-semibold text-zinc-100">{timeLeft}</span>
      </div>
    </div>
  );
}
