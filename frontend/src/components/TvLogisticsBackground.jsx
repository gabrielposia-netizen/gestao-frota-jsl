/** Fundo animado suave com temática de rotas/logística para o Painel TV */
export default function TvLogisticsBackground() {
  return (
    <div className="tv-motion-bg" aria-hidden="true">
      <div className="tv-motion-base" />
      <div className="tv-motion-grid" />
      <div className="tv-motion-routes">
        <svg className="tv-motion-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec1f28" stopOpacity="0" />
              <stop offset="40%" stopColor="#ec1f28" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#9a9a9a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="routeGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6b6b6b" stopOpacity="0" />
              <stop offset="50%" stopColor="#ec1f28" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6b6b6b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Rotas principais */}
          <path
            className="tv-route tv-route-a"
            d="M-80 220 C 220 180, 420 320, 680 260 S 1100 140, 1520 210"
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="2.5"
            strokeDasharray="14 16"
          />
          <path
            className="tv-route tv-route-b"
            d="M-60 520 C 260 460, 480 610, 760 540 S 1180 430, 1500 500"
            fill="none"
            stroke="url(#routeGrad2)"
            strokeWidth="2"
            strokeDasharray="10 18"
          />
          <path
            className="tv-route tv-route-c"
            d="M120 -40 C 180 200, 120 420, 280 620 S 720 860, 980 980"
            fill="none"
            stroke="rgba(236, 31, 40,0.12)"
            strokeWidth="2"
            strokeDasharray="8 14"
          />
          <path
            className="tv-route tv-route-d"
            d="M980 -20 C 920 180, 1080 340, 980 520 S 820 780, 1100 960"
            fill="none"
            stroke="rgba(100,100,100,0.16)"
            strokeWidth="2"
            strokeDasharray="12 20"
          />

          {/* Hubs / pontos de operação */}
          <g className="tv-hubs">
            <circle className="tv-hub" cx="280" cy="250" r="5" />
            <circle className="tv-hub-ring" cx="280" cy="250" r="18" />
            <circle className="tv-hub" cx="760" cy="540" r="5" />
            <circle className="tv-hub-ring tv-hub-ring-delay" cx="760" cy="540" r="18" />
            <circle className="tv-hub" cx="1080" cy="200" r="4" />
            <circle className="tv-hub-ring tv-hub-ring-delay-2" cx="1080" cy="200" r="16" />
            <circle className="tv-hub" cx="520" cy="700" r="4" />
          </g>

          {/* Silhuetas suaves de veículos em movimento */}
          <g className="tv-truck tv-truck-1" opacity="0.22">
            <rect x="0" y="0" width="46" height="18" rx="4" fill="#ec1f28" />
            <rect x="34" y="-6" width="18" height="14" rx="3" fill="#c40510" />
            <circle cx="10" cy="20" r="4" fill="#5a5a5a" />
            <circle cx="36" cy="20" r="4" fill="#5a5a5a" />
          </g>
          <g className="tv-truck tv-truck-2" opacity="0.16">
            <rect x="0" y="0" width="38" height="15" rx="3" fill="#7a7a7a" />
            <rect x="28" y="-5" width="14" height="12" rx="2" fill="#5f5f5f" />
            <circle cx="8" cy="17" r="3.5" fill="#4a4a4a" />
            <circle cx="30" cy="17" r="3.5" fill="#4a4a4a" />
          </g>
        </svg>
      </div>
      <div className="tv-motion-glow" />
      <div className="tv-motion-fog" />
    </div>
  );
}
