/// <reference types="vite/client" />

declare global {
  interface Window {
    ezstandalone?: {
      cmd: Array<() => void>;
      showAds: (...placeholderIds: number[]) => void;
      destroyPlaceholders: (...placeholderIds: number[]) => void;
      destroyAll: () => void;
    };
  }
}
