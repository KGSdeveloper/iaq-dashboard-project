/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Daikin Brand Colors
        daikin: {
          blue: '#00A6FB',
          darkblue: '#0056B3',
          lightblue: '#33B8FF',
        },
        // Custom IAQ Colors
        iaq: {
          excellent: '#00FF88',
          good: '#74B9FF',
          moderate: '#FDCB6E',
          poor: '#FF7675',
          critical: '#D63031'
        },
        // Glass-morphism background
        glass: {
          light: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.12)',
          dark: 'rgba(0, 0, 0, 0.08)'
        }
      },
      backgroundImage: {
        // Custom gradients for colored bars
        'rainbow-bar': 'linear-gradient(90deg, #00ff88, #00a6fb, #8b5cf6, #ec4899)',
        'temperature-bar': 'linear-gradient(90deg, #ef4444, #f97316)',
        'humidity-bar': 'linear-gradient(90deg, #3b82f6, #06b6d4)',
        'co2-bar': 'linear-gradient(90deg, #3b82f6, #4f46e5)',
        'pm25-bar': 'linear-gradient(90deg, #10b981, #34d399)',
        'weather-bar': 'linear-gradient(90deg, #f59e0b, #f97316)',
        'tvoc-bar': 'linear-gradient(90deg, #8b5cf6, #ec4899)',
        'pressure-bar': 'linear-gradient(90deg, #ef4444, #ec4899)',
        
        // Dashboard background
        'dashboard-bg': 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        
        // Glass-morphism gradients
        'glass-card': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        
        // Sensor gradients
        'mercury-gradient': 'linear-gradient(to top, #ef4444, #f97316)',
        'water-gradient': 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
        'pressure-gradient': 'linear-gradient(90deg, #10b981, #f59e0b, #ef4444)',
      },
      animation: {
        // Custom animations
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'heartbeat': 'heartbeat 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.5)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.5)',
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [
    // Add custom utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.glass-morphism': {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        },
        '.text-glow': {
          textShadow: '0 0 10px currentColor',
        }
      }
      addUtilities(newUtilities)
    }
  ],
}