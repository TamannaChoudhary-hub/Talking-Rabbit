import React, { useState, useEffect } from "react";

/**
 * TalkingRabbitAvatar
 * 
 * A 2D layered vector character with dynamic state-controlled animation:
 * 
 *               🐇 Rabbit
 *                  │
 *        ┌─────────┼─────────┐
 *        ↓         ↓         ↓
 *      Eyes      Mouth      Ears
 *        │         │         │
 *     blink      open/      move/
 *               close      wiggle
 *                  │
 *                  ↓
 *           Speaking animation
 * 
 * States:
 *  - IDLE: Gentle breathing, natural periodic blink, subtle ear twitch.
 *  - LISTENING: Ears perk up & lean in, wide focused eyes with audio soundwave ripple.
 *  - THINKING: Pensive glance upwards, one ear tilted, inquisitive brow.
 *  - SPEAKING: Continuous mouth syllable opening/closing with visible buck teeth & tongue, joyful eye expression, rhythmic ear bob.
 */
export default function TalkingRabbitAvatar({
  status = "IDLE", // "IDLE" | "LISTENING" | "THINKING" | "SPEAKING"
  voiceOn = true,
  size = "medium", // "small" | "medium" | "large"
  showStatusText = true,
  onToggleVoice,
}) {
  // Speech viseme cycle for organic syllable flaps when speaking
  const [visemeStep, setVisemeStep] = useState(0);

  useEffect(() => {
    let interval;
    if (status === "SPEAKING") {
      // Rapid viseme mouth oscillation (every 110ms)
      interval = setInterval(() => {
        setVisemeStep((prev) => (prev + 1) % 4);
      }, 110);
    } else {
      setVisemeStep(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Size dimensions
  const dimensions = {
    small: { w: 90, h: 90 },
    medium: { w: 140, h: 140 },
    large: { w: 190, h: 190 },
  }[size] || { w: 140, h: 140 };

  const getStatusLabel = () => {
    if (!voiceOn) return { text: "Voice Muted", badge: "muted", icon: "🔇" };
    switch (status) {
      case "LISTENING":
        return { text: "Listening to you...", badge: "listening", icon: "🎙️" };
      case "THINKING":
        return { text: "Analyzing dataset...", badge: "thinking", icon: "🧠" };
      case "SPEAKING":
        return { text: "Talking to you...", badge: "speaking", icon: "🔊" };
      default:
        return { text: "Ready to help", badge: "idle", icon: "✨" };
    }
  };

  const statusInfo = getStatusLabel();

  return (
    <div className={`rabbit-avatar-container size-${size} state-${status.toLowerCase()} ${voiceOn ? "voice-enabled" : "voice-disabled"}`}>
      
      {/* Visual Aura Glow for Speaking & Listening */}
      <div className="rabbit-aura-glow" />

      {/* SVG Multi-Layer Rabbit Character */}
      <svg
        className={`rabbit-svg state-${status.toLowerCase()} viseme-${visemeStep}`}
        viewBox="0 0 200 200"
        width={dimensions.w}
        height={dimensions.h}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients for Rabbit Fur & Ears */}
          <linearGradient id="rabbitFur" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f8f9fc" />
            <stop offset="100%" stopColor="#e8ecf4" />
          </linearGradient>

          <linearGradient id="earInnerPink" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffb8cc" />
            <stop offset="100%" stopColor="#f8719d" />
          </linearGradient>

          <linearGradient id="cheekBlush" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff7b9f" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ff4d79" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="eyePupilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="60%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>

          <linearGradient id="mouthCavity" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#881337" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>

          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* ================= LAYER 1: EARS ================= */}
        <g className="rabbit-layer-ears">
          {/* Left Ear */}
          <g className="rabbit-ear ear-left" transform-origin="70 82">
            {/* Outer Ear */}
            <path
              d="M 64 82 C 45 42, 38 12, 58 10 C 76 8, 80 40, 78 82 Z"
              fill="url(#rabbitFur)"
              stroke="#cbd5e1"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Inner Pink Pad */}
            <path
              d="M 65 72 C 54 44, 48 22, 60 20 C 70 19, 72 42, 73 72 Z"
              fill="url(#earInnerPink)"
              opacity="0.85"
            />
          </g>

          {/* Right Ear */}
          <g className="rabbit-ear ear-right" transform-origin="130 82">
            {/* Outer Ear */}
            <path
              d="M 122 82 C 120 40, 124 8, 142 10 C 162 12, 155 42, 136 82 Z"
              fill="url(#rabbitFur)"
              stroke="#cbd5e1"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Inner Pink Pad */}
            <path
              d="M 127 72 C 128 42, 130 19, 140 20 C 152 22, 146 44, 135 72 Z"
              fill="url(#earInnerPink)"
              opacity="0.85"
            />
          </g>
        </g>

        {/* ================= LAYER 2: HEAD & BODY BASE ================= */}
        <g className="rabbit-layer-head" filter="url(#softShadow)">
          {/* Main Head Base */}
          <ellipse
            cx="100"
            cy="118"
            rx="56"
            ry="48"
            fill="url(#rabbitFur)"
            stroke="#cbd5e1"
            strokeWidth="2.4"
          />

          {/* Forehead Fluff Tuft */}
          <path
            d="M 94 72 Q 100 64 104 70 Q 108 62 112 73 Z"
            fill="#ffffff"
          />

          {/* Rosy Cheeks (Blush) */}
          <ellipse cx="64" cy="126" rx="11" ry="6.5" fill="url(#cheekBlush)" />
          <ellipse cx="136" cy="126" rx="11" ry="6.5" fill="url(#cheekBlush)" />
        </g>

        {/* ================= LAYER 3: EYES ================= */}
        <g className="rabbit-layer-eyes">
          {/* Left Eye */}
          <g className="rabbit-eye eye-left" transform-origin="76 108">
            {status === "SPEAKING" ? (
              // Joyful curved talking eye (^_^)
              <path
                d="M 68 110 Q 76 100 84 110"
                stroke="#1e293b"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />
            ) : status === "THINKING" ? (
              // Inquisitive / Looking up & squinting
              <g>
                <ellipse cx="76" cy="107" rx="8" ry="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                <ellipse cx="78" cy="104" rx="5" ry="5" fill="url(#eyePupilGrad)" />
                <circle cx="80" cy="102" r="1.8" fill="#ffffff" />
                {/* Thinking brow line */}
                <path d="M 67 98 Q 76 95 85 101" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              </g>
            ) : (
              // Normal / Listening eyes with blinking
              <g className="eye-blink-group">
                <ellipse cx="76" cy="108" rx={status === "LISTENING" ? 9 : 8} ry={status === "LISTENING" ? 10.5 : 9.5} fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                <ellipse cx="76" cy="108" rx={status === "LISTENING" ? 6.5 : 5.8} ry={status === "LISTENING" ? 7.8 : 7} fill="url(#eyePupilGrad)" />
                {/* Catchlight sparkles */}
                <circle cx="74" cy="105" r="2.4" fill="#ffffff" />
                <circle cx="78" cy="110" r="1.2" fill="#ffffff" />
              </g>
            )}
          </g>

          {/* Right Eye */}
          <g className="rabbit-eye eye-right" transform-origin="124 108">
            {status === "SPEAKING" ? (
              // Joyful curved talking eye (^_^)
              <path
                d="M 116 110 Q 124 100 132 110"
                stroke="#1e293b"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />
            ) : status === "THINKING" ? (
              // Inquisitive / Looking up
              <g>
                <ellipse cx="124" cy="107" rx="8" ry="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                <ellipse cx="126" cy="104" rx="5" ry="5" fill="url(#eyePupilGrad)" />
                <circle cx="128" cy="102" r="1.8" fill="#ffffff" />
                {/* Thinking brow line */}
                <path d="M 115 101 Q 124 95 133 98" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              </g>
            ) : (
              // Normal / Listening eyes with blinking
              <g className="eye-blink-group">
                <ellipse cx="124" cy="108" rx={status === "LISTENING" ? 9 : 8} ry={status === "LISTENING" ? 10.5 : 9.5} fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                <ellipse cx="124" cy="108" rx={status === "LISTENING" ? 6.5 : 5.8} ry={status === "LISTENING" ? 7.8 : 7} fill="url(#eyePupilGrad)" />
                {/* Catchlight sparkles */}
                <circle cx="122" cy="105" r="2.4" fill="#ffffff" />
                <circle cx="126" cy="110" r="1.2" fill="#ffffff" />
              </g>
            )}
          </g>
        </g>

        {/* ================= LAYER 4: MUZZLE, NOSE & WHISKERS ================= */}
        <g className="rabbit-layer-muzzle">
          {/* Whiskers (Left) */}
          <path d="M 64 126 L 40 121" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" className="whisker whisker-1" />
          <path d="M 63 130 L 38 131" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" className="whisker whisker-2" />
          <path d="M 64 134 L 42 139" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" className="whisker whisker-3" />

          {/* Whiskers (Right) */}
          <path d="M 136 126 L 160 121" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" className="whisker whisker-4" />
          <path d="M 137 130 L 162 131" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" className="whisker whisker-5" />
          <path d="M 136 134 L 158 139" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" className="whisker whisker-6" />

          {/* Nose (Cute Pink Triangle) */}
          <path
            d="M 95 120 Q 100 117 105 120 Q 102 126 100 126 Q 98 126 95 120 Z"
            fill="#f43f5e"
          />

          {/* Philtrum line */}
          <line x1="100" y1="126" x2="100" y2="130" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* ================= LAYER 5: MOUTH (DYNAMIC SPEECH VISUALS) ================= */}
        <g className="rabbit-layer-mouth" transform-origin="100 134">
          {status === "SPEAKING" ? (
            // SPEAKING: Live Animated Syllable Flap Mouth
            <g className="mouth-speaking-anim">
              {visemeStep === 0 && (
                // Small Open (Phoneme O / U)
                <g>
                  <ellipse cx="100" cy="136" rx="8" ry="7.5" fill="url(#mouthCavity)" stroke="#1e293b" strokeWidth="1.8" />
                  {/* Bunny Buck Teeth */}
                  <rect x="96.5" y="130" width="3.2" height="4" rx="1" fill="#ffffff" />
                  <rect x="100.3" y="130" width="3.2" height="4" rx="1" fill="#ffffff" />
                  {/* Pink Tongue */}
                  <ellipse cx="100" cy="141" rx="5" ry="3" fill="#fb7185" />
                </g>
              )}

              {visemeStep === 1 && (
                // Wide Open (Phoneme A / E / I)
                <g>
                  <path
                    d="M 88 131 Q 100 130 112 131 Q 112 145 100 146 Q 88 145 88 131 Z"
                    fill="url(#mouthCavity)"
                    stroke="#1e293b"
                    strokeWidth="1.8"
                  />
                  {/* Bunny Buck Teeth */}
                  <rect x="96" y="131" width="3.6" height="5" rx="1" fill="#ffffff" />
                  <rect x="100.4" y="131" width="3.6" height="5" rx="1" fill="#ffffff" />
                  {/* Tongue */}
                  <ellipse cx="100" cy="143" rx="7" ry="3.5" fill="#fb7185" />
                </g>
              )}

              {visemeStep === 2 && (
                // Medium Open (Phoneme L / T / D)
                <g>
                  <path
                    d="M 91 132 Q 100 131 109 132 Q 108 141 100 142 Q 92 141 91 132 Z"
                    fill="url(#mouthCavity)"
                    stroke="#1e293b"
                    strokeWidth="1.8"
                  />
                  {/* Bunny Buck Teeth */}
                  <rect x="96.5" y="132" width="3.2" height="4" rx="1" fill="#ffffff" />
                  <rect x="100.3" y="132" width="3.2" height="4" rx="1" fill="#ffffff" />
                  {/* Tongue */}
                  <ellipse cx="100" cy="140" rx="5" ry="2.5" fill="#fb7185" />
                </g>
              )}

              {visemeStep === 3 && (
                // Closed Smile (Phoneme M / B / P)
                <g>
                  <path
                    d="M 90 131 Q 95 136 100 131 Q 105 136 110 131"
                    stroke="#1e293b"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Teeny Peeking Teeth */}
                  <rect x="97" y="131" width="2.8" height="3" rx="0.8" fill="#ffffff" />
                  <rect x="100.2" y="131" width="2.8" height="3" rx="0.8" fill="#ffffff" />
                </g>
              )}
            </g>
          ) : status === "THINKING" ? (
            // THINKING: Pensive Crooked Mouth (Hmm...)
            <g>
              <path
                d="M 92 133 Q 98 135 106 130"
                stroke="#334155"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
              <rect x="97" y="133" width="2.6" height="2.8" rx="0.8" fill="#ffffff" />
              <rect x="100" y="133" width="2.6" height="2.8" rx="0.8" fill="#ffffff" />
            </g>
          ) : status === "LISTENING" ? (
            // LISTENING: Curious small attentive mouth
            <g>
              <ellipse cx="100" cy="134" rx="4.5" ry="4.5" fill="#334155" />
              <rect x="98.2" y="130.5" width="3.6" height="3" rx="0.8" fill="#ffffff" />
            </g>
          ) : (
            // IDLE: Sweet Classic Bunny Smile
            <g>
              <path
                d="M 91 130 Q 95.5 135 100 130 Q 104.5 135 109 130"
                stroke="#334155"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              {/* Bunny Buck Teeth */}
              <rect x="97.2" y="130" width="2.6" height="3.5" rx="0.8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
              <rect x="100.2" y="130" width="2.6" height="3.5" rx="0.8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
            </g>
          )}
        </g>
      </svg>

      {/* Live State Badge & Audio Wave Indicators */}
      {showStatusText && (
        <div className="rabbit-status-strip">
          <button
            type="button"
            className={`rabbit-badge badge-${statusInfo.badge}`}
            onClick={onToggleVoice}
            title={voiceOn ? "Voice synthesis is active — click to toggle" : "Voice is muted — click to enable"}
          >
            <span className="badge-icon">{statusInfo.icon}</span>
            <span className="badge-text">{statusInfo.text}</span>
            {status === "SPEAKING" && (
              <span className="live-sound-bars">
                <span className="bar bar-1"></span>
                <span className="bar bar-2"></span>
                <span className="bar bar-3"></span>
              </span>
            )}
            {status === "LISTENING" && (
              <span className="live-pulse-dot"></span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
