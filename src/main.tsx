// Intentional no-op bootstrap.
// The UI lives in public/ and is rendered by components/app.jsx via Babel standalone
// (see index.html). This file exists only so Vite has a declared ES module entry
// for dev/HMR; removing it makes `vite build` complain.
//
// When the runtime-Babel pattern is replaced with a proper TSX port, swap this
// file back to a ReactDOM.createRoot bootstrap.
export {};
