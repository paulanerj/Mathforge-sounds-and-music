import { useEffect, useRef, useState } from 'react';
import { MusicTrackId, MUSIC_MANIFEST } from '../audio/musicManifest';

// Cache for unavailable tracks to avoid repeated network errors
const unavailableTracks = new Set<string>();

export function useMusicPlayer(trackId: MusicTrackId | null, soundMode: 'on' | 'quiet' | 'off') {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<MusicTrackId | null>(null);

  useEffect(() => {
    // 1. If soundMode is off or no track requested, stop and clear.
    if (soundMode === 'off' || !trackId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      setCurrentTrackId(null);
      return;
    }

    // 2. Fetch manifest config
    const trackMeta = MUSIC_MANIFEST[trackId];
    if (!trackMeta) return;

    // 3. Handle track switching
    if (trackId !== currentTrackId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Check cache to avoid spam
      if (unavailableTracks.has(trackMeta.primarySrc)) {
        return;
      }

      const audio = new Audio(trackMeta.primarySrc);
      audio.loop = trackMeta.loop;

      // Prepare volume
      let targetVolume = 0;
      if (soundMode === 'on') {
        if (trackMeta.volumeRole === 'menu') targetVolume = 0.28;
        else if (trackMeta.volumeRole === 'gameplay') targetVolume = 0.22;
        else if (trackMeta.volumeRole === 'dark_mode') targetVolume = 0.16;
        else if (trackMeta.volumeRole === 'stinger') targetVolume = 0.35;
      } else if (soundMode === 'quiet') {
        if (trackMeta.volumeRole === 'menu') targetVolume = 0.10;
        else if (trackMeta.volumeRole === 'gameplay') targetVolume = 0.08;
        else if (trackMeta.volumeRole === 'dark_mode') targetVolume = 0.06;
        else if (trackMeta.volumeRole === 'stinger') targetVolume = 0.16;
      }
      
      audio.volume = targetVolume;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // It's normal for files to be missing (404) or autoplay blocked.
          // Silently cache it as unavailable to avoid retry spam
          if (error.name === 'NotSupportedError' || error.name === 'NotAllowedError') {
             // Autoplay blocked, fine.
          } else {
             unavailableTracks.add(trackMeta.primarySrc);
          }
        });
      }

      audio.onerror = () => {
        unavailableTracks.add(trackMeta.primarySrc);
        // Optional fallback logic could go here
        if (trackMeta.fallbackSrc && !unavailableTracks.has(trackMeta.fallbackSrc)) {
          audio.src = trackMeta.fallbackSrc;
          audio.play().catch(() => unavailableTracks.add(trackMeta.fallbackSrc!));
        }
      };

      audioRef.current = audio;
      setCurrentTrackId(trackId);
    } else {
       // Track hasn't changed, but soundMode might have changed (e.g. from quiet to on)
       if (audioRef.current) {
          let targetVolume = 0;
          if (soundMode === 'on') {
            if (trackMeta.volumeRole === 'menu') targetVolume = 0.28;
            else if (trackMeta.volumeRole === 'gameplay') targetVolume = 0.22;
            else if (trackMeta.volumeRole === 'dark_mode') targetVolume = 0.16;
            else if (trackMeta.volumeRole === 'stinger') targetVolume = 0.35;
          } else if (soundMode === 'quiet') {
            if (trackMeta.volumeRole === 'menu') targetVolume = 0.10;
            else if (trackMeta.volumeRole === 'gameplay') targetVolume = 0.08;
            else if (trackMeta.volumeRole === 'dark_mode') targetVolume = 0.06;
            else if (trackMeta.volumeRole === 'stinger') targetVolume = 0.16;
          }
          audioRef.current.volume = targetVolume;
       }
    }

  }, [trackId, soundMode, currentTrackId]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);
}
