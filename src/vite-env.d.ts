/// <reference types="vite/client" />
/// <reference types="google.maps" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { google: any; }
}
export {};
