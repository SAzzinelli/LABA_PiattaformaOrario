/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'laba-primary': '#033157',
        'laba-monday': '#FF6B6B',
        'laba-tuesday': '#4ECDC4',
        'laba-wednesday': '#45B7D1',
        'laba-thursday': '#FFA07A',
        'laba-friday': '#98D8C8',
        'laba-saturday': '#F7DC6F',
        'laba-sunday': '#BB8FCE',
      },
    },
  },
  plugins: [],
}

