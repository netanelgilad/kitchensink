// Core infrastructure
export * from "./core/context-provider";
export * from "./core/consumer-element";

// Store components (complex - using headless services)
export * from "./store/wix-product";
export * from "./store/wix-product-name";
export * from "./store/wix-product-description";
export * from "./store/wix-product-price";

// Simple store components (direct Wix API)
export * from "./store/wix-product-simple";

// Import all components to register them
import "./store/wix-product";
import "./store/wix-product-name";
import "./store/wix-product-description";
import "./store/wix-product-price";
import "./store/wix-product-simple";

// Version info
export const WIX_WEB_COMPONENTS_VERSION = "1.0.0";

// Utility function to check if all components are loaded
export function isWixWebComponentsLoaded(): boolean {
  const requiredComponents = [
    "wix-product",
    "wix-product-name",
    "wix-product-description",
    "wix-product-price",
    "wix-product-simple",
    "wix-product-name-simple",
    "wix-product-price-simple",
  ];

  return requiredComponents.every(
    (tagName) => customElements.get(tagName) !== undefined
  );
}

// Register event for when all components are ready
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    if (isWixWebComponentsLoaded()) {
      window.dispatchEvent(
        new CustomEvent("wix-web-components-ready", {
          detail: { version: WIX_WEB_COMPONENTS_VERSION },
        })
      );
    }
  });
}

console.log(`Wix Web Components v${WIX_WEB_COMPONENTS_VERSION} loaded`);
