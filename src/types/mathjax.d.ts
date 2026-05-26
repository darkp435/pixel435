export {};

declare global {
  interface Window {
    MathJax: {
      typeset: () => void;
      tex?: unknown;
      startup?: unknown;
    };
  }
}