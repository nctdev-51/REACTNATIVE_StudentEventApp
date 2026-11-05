import { registerRootComponent } from "expo";
import { Dimensions } from "react-native";

// Polyfill window.matchMedia for Tamagui on React Native to avoid spamming warnings
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as any;
}

import App from "./App";

registerRootComponent(App);
