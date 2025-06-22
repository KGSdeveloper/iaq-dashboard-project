import React from 'react';

const IAQIndex = ({ value, level, size = "large" }) => {
  const radius = size === "large" ? 80 : 60;
  const strokeWidth = size === "large" ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={radius * 2 + strokeWidth * 2}
        height={radius * 2 + strokeWidth * 2}
      >
        {/* Background circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke={level.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${level.color}40)`
          }}
        />
      </svg>
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className={`font-bold text-white ${size === "large" ? "text-5xl" : "text-3xl"}`}>
          {value}
        </div>
        <div className={`font-medium mt-2 ${size === "large" ? "text-lg" : "text-sm"}`} 
             style={{ color: level.color }}>
          {level.label}
        </div>
        <div className={`${size === "large" ? "text-4xl mt-2" : "text-2xl mt-1"}`}>
          😊
        </div>
      </div>
    </div>
  );
};

export default IAQIndex;