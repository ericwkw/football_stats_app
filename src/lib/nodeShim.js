// This file is a shim to handle Node.js built-in modules in the browser

if (typeof window !== 'undefined') {
  // We're in the browser, mock Node.js modules
  window.Buffer = window.Buffer || {};
  window.process = window.process || { 
    env: {}, 
    cwd: () => '/',
    browser: true
  };
}

export { }; 