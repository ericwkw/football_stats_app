// Client-side fallbacks for Node.js built-in modules
// This file provides empty implementations for Node.js modules
// that might be imported in browser code.

// Empty fs implementation
export const fs = {
  lstat: () => Promise.resolve({}),
  stat: () => Promise.resolve({}),
  readdir: () => Promise.resolve([]),
  readdirSync: () => [],
};

// Empty path implementation
export const path = {
  join: (...args) => args.join('/'),
  resolve: (...args) => args.join('/'),
  dirname: (path) => path.split('/').slice(0, -1).join('/'),
  basename: (path) => path.split('/').pop(),
};

// Empty os implementation
export const os = {
  platform: () => typeof window !== 'undefined' ? 'browser' : 'node',
};

// Other common Node.js modules that might be used
export const process = {
  cwd: () => '/',
  env: {},
}; 