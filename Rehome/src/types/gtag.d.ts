// Type definitions for Google Analytics gtag.js
interface Window {
  gtag: (
    command: 'config' | 'event' | 'set' | 'js',
    targetId: string,
    config?: Record<string, any>
  ) => void;
}

declare const gtag: Window['gtag']; 