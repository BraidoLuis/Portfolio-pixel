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
    function playSelectionSound(event: Event) {
      if (!enabled || !audioRef.current) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const interactiveElement = target.closest(
        event.type === "change" ? "input[type='radio']" : "button, a, [role='button']",
      );

      if (!interactiveElement) {
        return;
      }

      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => undefined);
    }

    document.addEventListener("click", playSelectionSound);
    // Native labels forward a click to the radio. Use its change event so
    // pointer and keyboard selection play once, without label/click duplicates.
    document.addEventListener("change", playSelectionSound);

    return () => {
      document.removeEventListener("click", playSelectionSound);
      document.removeEventListener("change", playSelectionSound);
    };
  }, [enabled]);

  return null;
}