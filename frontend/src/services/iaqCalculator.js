import { IAQ_LEVELS } from '../utils/constants.js';

class IAQCalculator {
  // Calculate IAQ Index based on multiple sensor values
  calculateIAQIndex(sensorData) {
    const weights = {
      PM25: 0.25,
      CO2: 0.20,
      TEMPERATURE: 0.15,
      HUMIDITY: 0.15,
      TVOC: 0.25
    };

    let totalScore = 0;
    let totalWeight = 0;

    // PM2.5 scoring (lower is better)
    if (sensorData.PM25 !== undefined) {
      const pm25Score = this.calculatePM25Score(sensorData.PM25);
      totalScore += pm25Score * weights.PM25;
      totalWeight += weights.PM25;
    }

    // CO2 scoring (lower is better)
    if (sensorData.CO2 !== undefined) {
      const co2Score = this.calculateCO2Score(sensorData.CO2);
      totalScore += co2Score * weights.CO2;
      totalWeight += weights.CO2;
    }

    // Temperature scoring (comfort range is best)
    if (sensorData.TEMPERATURE !== undefined) {
      const tempScore = this.calculateTemperatureScore(sensorData.TEMPERATURE);
      totalScore += tempScore * weights.TEMPERATURE;
      totalWeight += weights.TEMPERATURE;
    }

    // Humidity scoring (comfort range is best)
    if (sensorData.HUMIDITY !== undefined) {
      const humidityScore = this.calculateHumidityScore(sensorData.HUMIDITY);
      totalScore += humidityScore * weights.HUMIDITY;
      totalWeight += weights.HUMIDITY;
    }

    // TVOC scoring (lower is better)
    if (sensorData.TVOC !== undefined) {
      const tvocScore = this.calculateTVOCScore(sensorData.TVOC);
      totalScore += tvocScore * weights.TVOC;
      totalWeight += weights.TVOC;
    }

    // Calculate weighted average
    const iaqIndex = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    
    return {
      index: Math.max(0, Math.min(300, iaqIndex)), // Clamp between 0-300
      level: this.getIAQLevel(iaqIndex),
      components: {
        PM25: sensorData.PM25 ? this.calculatePM25Score(sensorData.PM25) : null,
        CO2: sensorData.CO2 ? this.calculateCO2Score(sensorData.CO2) : null,
        TEMPERATURE: sensorData.TEMPERATURE ? this.calculateTemperatureScore(sensorData.TEMPERATURE) : null,
        HUMIDITY: sensorData.HUMIDITY ? this.calculateHumidityScore(sensorData.HUMIDITY) : null,
        TVOC: sensorData.TVOC ? this.calculateTVOCScore(sensorData.TVOC) : null
      }
    };
  }

  calculatePM25Score(value) {
    if (value <= 12) return 50;
    if (value <= 35) return 100;
    if (value <= 55) return 150;
    if (value <= 150) return 200;
    return 300;
  }

  calculateCO2Score(value) {
    if (value <= 600) return 50;
    if (value <= 1000) return 100;
    if (value <= 1500) return 150;
    if (value <= 2000) return 200;
    return 300;
  }

  calculateTemperatureScore(value) {
    // Optimal range: 20-26°C
    if (value >= 20 && value <= 26) return 50;
    if (value >= 18 && value <= 28) return 100;
    if (value >= 16 && value <= 30) return 150;
    return 200;
  }

  calculateHumidityScore(value) {
    // Optimal range: 40-60%
    if (value >= 40 && value <= 60) return 50;
    if (value >= 30 && value <= 70) return 100;
    if (value >= 25 && value <= 75) return 150;
    return 200;
  }

  calculateTVOCScore(value) {
    if (value <= 220) return 50;
    if (value <= 660) return 100;
    if (value <= 2220) return 150;
    if (value <= 5500) return 200;
    return 300;
  }

  getIAQLevel(index) {
    for (const [key, level] of Object.entries(IAQ_LEVELS)) {
      if (index >= level.min && index <= level.max) {
        return level;
      }
    }
    return IAQ_LEVELS.VERY_POOR;
  }
}

export default new IAQCalculator();