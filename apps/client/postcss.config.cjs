const { resolve } = require('node:path');

module.exports = {
  plugins: {
    '@tailwindcss/postcss': {
      config: resolve(__dirname, './tailwind.config.ts'),
    },
    autoprefixer: {},
  },
};
