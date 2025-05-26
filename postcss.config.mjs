// This configuration is compatible with both Tailwind CSS v3 and v4
let plugins = {};

try {
  // Try to load @tailwindcss/postcss (for Tailwind CSS v4)
  require.resolve('@tailwindcss/postcss');
  plugins = {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  };
} catch {
  // Fallback to standard config (for Tailwind CSS v3)
  plugins = {
    tailwindcss: {},
    autoprefixer: {},
  };
}

export default {
  plugins,
};
