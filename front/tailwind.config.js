module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        harry: ['"Lobster"', 'cursive'],
        magic: ['"MedievalSharp"', 'cursive'],
        book: ['"Crimson Text"', 'serif'],
      },
      backgroundImage: {
        'hogwarts-bg': "url('/hogwarts-night.jpg')",
        'parchment': "url('/parchment-texture.jpg')",
      },
      boxShadow: {
        magical: '0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.1)',
        glow: '0 0 30px rgba(138, 43, 226, 0.6)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.5s linear infinite',
        sparkles: 'sparkles 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        sparkles: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        }
      }
    },
  },
  plugins: [],
}