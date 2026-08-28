"use client";

import { useEffect, useRef } from "react";

type UiSoundControllerProps = {
  enabled: boolean;
  volume?: number;
};

export function UiSoundController({
  enabled,
  volume = 0.22,
}: UiSoundControllerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/game/audio/effects/ui-select.mp3");
    audio.preload = "auto";
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [volume]);

  useEffect(() => {
    function playSelectionSound(event: MouseEvent) {
      if (!enabled || !audioRef.current) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const interactiveElement = target.closest(
        "button, a, [role='button']",
      );

      if (!interactiveElement) {
        return;
      }

      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => undefined);
    }

    document.addEventListener("click", playSelectionSound);

    return () => {
      document.removeEventListener("click", playSelectionSound);
    };
  }, [enabled]);

  return null;
}