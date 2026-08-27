"use client";

import { useEffect, useRef } from "react";

type SoundtrackControllerProps = {
  active: boolean;
  enabled: boolean;
  volume: number;
};

export function SoundtrackController({ active, enabled, volume }: SoundtrackControllerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundtrackUrl = process.env.NEXT_PUBLIC_SOUNDTRACK_URL;

  useEffect(() => {
    if (!soundtrackUrl) return;
    const audio = new Audio(soundtrackUrl);
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [soundtrackUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    if (active && enabled) void audio.play().catch(() => undefined);
    else audio.pause();
  }, [active, enabled, volume]);

  return null;
}
