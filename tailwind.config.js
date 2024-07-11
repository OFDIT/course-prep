/** @type {import('tailwindcss').Config} */
export default {
  content: ["./views/**/*.{html,js,ts}"],
  theme: {
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

