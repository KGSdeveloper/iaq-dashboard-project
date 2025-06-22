import React from 'react';

const IAQIndex = ({ value, level, size = 'large' }) => {
  // Enhanced Face Expression Component
  const IAQFaceExpression = ({ value }) => {
    const expression = value >= 85 ? 'excellent' : value >= 70 ? 'good' : value >= 50 ? 'moderate' : 'poor';

    return (
      <div className="w-16 h-16 mx-auto mb-4">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="faceGlow" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </radialGradient>
          </defs>

          {/* Face circle */}
          <circle 
            cx="50" cy="50" r="45" 
            fill="url(#faceGlow)" 
            stroke="currentColor" 
            strokeWidth="2"
            className="animate-pulse"
            style={{ color: level.color }}
          />

          {/* Eyes */}
          <g className="animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }}>
            {expression === 'excellent' ? (
              <>
                <circle cx="35" cy="35" r="3" fill="currentColor" style={{ color: level.color }} />
                <circle cx="65" cy="35" r="3" fill="currentColor" style={{ color: level.color }} />
                <circle cx="35" cy="33" r="1" fill="white" />
                <circle cx="65" cy="33" r="1" fill="white" />
              </>
            ) : (
              <>
                <ellipse cx="35" cy="35" rx="4" ry="3" fill="currentColor" style={{ color: level.color }} />
                <ellipse cx="65" cy="35" rx="4" ry="3" fill="currentColor" style={{ color: level.color }} />
              </>
            )}
          </g>

          {/* Mouth expressions */}
          {expression === 'excellent' && (
            <path d="M 30 60 Q 50 75 70 60" stroke="currentColor" strokeWidth="3" 
                  fill="none" strokeLinecap="round" style={{ color: level.color }} />
          )}
          {expression === 'good' && (
            <path d="M 35 65 Q 50 70 65 65" stroke="currentColor" strokeWidth="3" 
                  fill="none" strokeLinecap="round" style={{ color: level.color }} />
          )}
          {expression === 'moderate' && (
            <line x1="35" y1="65" x2="65" y2="65" stroke="currentColor" strokeWidth="3" 
                  strokeLinecap="round" style={{ color: level.color }} />
          )}
          {expression === 'poor' && (
            <path d="M 30 70 Q 50 55 70 70" stroke="currentColor" strokeWidth="3" 
                  fill="none" strokeLinecap="round" style={{ color: level.color }} />
          )}

          {/* Happy cheeks for excellent */}
          {expression === 'excellent' && (
            <>
              <circle cx="25" cy="50" r="4" fill="rgba(255,192,203,0.6)" className="animate-pulse" />
              <circle cx="75" cy="50" r="4" fill="rgba(255,192,203,0.6)" className="animate-pulse" />
            </>
          )}
        </svg>
      </div>
    );
  };

  const circumference = 2 * Math.PI * 85;
  const progress = (value / 100) * 75; // 75% of circle
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="100" cy="100" r="85"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        {/* Progress circle with glow */}
        <circle
          cx="100" cy="100" r="85"
          fill="none"
          stroke={level.color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ 
            filter: `drop-shadow(0 0 10px ${level.color})`,
            animation: 'pulse 3s ease-in-out infinite'
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-6xl font-bold text-white mb-2">{value}</div>
        <div className="text-xl font-medium mb-2" style={{ color: level.color }}>
          {level.label}
        </div>
        <IAQFaceExpression value={value} />
      </div>
    </div>
  );
};

export default IAQIndex;