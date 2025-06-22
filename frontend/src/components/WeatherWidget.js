import React from 'react';

const WeatherWidget = ({ location, temperature, humidity, condition }) => {
  const getWeatherIcon = (condition) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return '☀️';
      case 'cloudy':
      case 'overcast':
        return '☁️';
      case 'rainy':
      case 'rain':
        return '🌧️';
      case 'stormy':
        return '⛈️';
      case 'snowy':
      case 'snow':
        return '❄️';
      default:
        return '☀️';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-medium text-gray-200 mb-4">{location}</h3>
      
      <div className="flex-1 flex items-center justify-between">
        {/* Weather Icon */}
        <div className="text-6xl animate-float">
          {getWeatherIcon(condition)}
        </div>
        
        {/* Weather Info */}
        <div className="text-right">
          <div className="text-4xl font-bold text-white mb-1">
            {temperature}°C
          </div>
          <div className="text-yellow-400 text-lg font-medium mb-3">
            {condition}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <div className="text-blue-400">💧</div>
            <div className="text-sm text-gray-300">
              {humidity}% Humidity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;