import React, { useState, useEffect, useRef } from 'react';
import './EntranceTransition.css';

export default function EntranceTransition() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const exitTimeoutRef = useRef(null);

  // Initialize intro based on session state and URL flags
  useEffect(() => {
    const hasSeen = sessionStorage.getItem('burhani_intro_seen');
    const params = new URLSearchParams(window.location.search);
    const forceIntro = params.get('intro') === 'true' || params.get('replay') === 'true';

    // Show on first visit of session or if forced
    if (!hasSeen || forceIntro) {
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    }

    // Global listener for on-demand replaying
    const triggerReplay = () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      setIsExiting(false);
      setProgress(0);
      setIsOpen(true);
      document.body.style.overflow = 'hidden';

      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('burhani:replay-intro', triggerReplay);

    // Keyboard shortcut (Escape to skip)
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        dismissIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('burhani:replay-intro', triggerReplay);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  // Ensure DOM muted property and playback starts when opened
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.muted = isMuted;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay prevented or interrupted:', err);
        });
      }
    }
  }, [isOpen, isMuted]);

  const dismissIntro = () => {
    if (isExiting) return;
    setIsExiting(true);
    sessionStorage.setItem('burhani_intro_seen', 'true');

    // Smooth cinematic dissolve duration: 850ms
    exitTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsExiting(false);
      document.body.style.overflow = '';
    }, 850);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);

      // Smooth auto-transition starting 0.5s before video ends
      if (videoRef.current.duration - videoRef.current.currentTime < 0.5 && !isExiting) {
        dismissIntro();
      }
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const handleOverlayClick = () => {
    // Tap anywhere to unmute if muted
    if (isMuted && videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`burhani-entrance-overlay ${isExiting ? 'is-exiting' : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-label="Welcome video intro"
    >
      {/* HTML5 Video Player with autoPlay and multiple source fallbacks */}
      <video
        ref={videoRef}
        className="burhani-entrance-video"
        autoPlay
        playsInline
        muted={isMuted}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={dismissIntro}
        onError={() => {
          // If playback error occurs, dismiss cleanly so website is accessible
          dismissIntro();
        }}
      >
        <source src="/media/entrance-video.mp4" type="video/mp4" />
        <source src="/media/burhani%20enterance%20video/final%20video%20for%20website.mp4" type="video/mp4" />
        <source src="/entrance-video.mp4" type="video/mp4" />
      </video>

      {/* Cinematic Vignette */}
      <div className="burhani-entrance-vignette" />

      {/* Top Header Bar */}
      <div className="burhani-entrance-topbar">
        <div className="burhani-entrance-brand">
          <span className="burhani-entrance-brand-dot"></span>
          <span>BURHANI HARDWARE & MACHINERY</span>
        </div>

        <div className="burhani-entrance-actions">
          {/* Sound Toggle */}
          <button
            type="button"
            className="burhani-entrance-btn sound-btn"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
          >
            <i className={`bi ${isMuted ? 'bi-volume-mute-fill' : 'bi-volume-up-fill'}`}></i>
            <span>{isMuted ? 'Unmute' : 'Sound On'}</span>
          </button>

          {/* Skip / Enter Website Button */}
          <button
            type="button"
            className="burhani-entrance-btn skip-btn"
            onClick={(e) => {
              e.stopPropagation();
              dismissIntro();
            }}
            aria-label="Skip intro and enter website"
          >
            <span>Enter Website</span>
            <i className="bi bi-arrow-right"></i>
          </button>
        </div>
      </div>

      {/* Playback Progress Line */}
      <div className="burhani-entrance-progressbar">
        <div
          className="burhani-entrance-progressfill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Subtle Hint */}
      <div className="burhani-entrance-hint">
        <span>Click anywhere to unmute • Press Esc to skip</span>
      </div>
    </div>
  );
}
