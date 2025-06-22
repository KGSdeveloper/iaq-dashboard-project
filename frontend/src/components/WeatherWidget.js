import React from 'react';

const WeatherWidget = ({ location, temperature, humidity, condition }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="text-sm text-gray-400 mb-3">{location}</div>
      <div className="flex-1 flex items-center gap-4">
        <div className="text-4xl animate-bounce">☀️</div>
        <div>
          <div className="text-2xl font-bold text-white">{temperature}°C</div>
          <div className="text-gray-300">{condition}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-400 mt-4">
        <span>💧</span>
        <span>{humidity}% Humidity</span>
      </div>
    </div>
  );
};

export default WeatherWidget;