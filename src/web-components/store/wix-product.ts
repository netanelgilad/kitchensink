import { ContextProviderElement } from "../core/context-provider";
import {
  ProductServiceDefinition,
  ProductService,
  loadProductServiceConfig,
} from "../../headless/store/product-service";
import {
  SelectedVariantServiceDefinition,
  SelectedVariantService,
} from "../../headless/store/selected-variant-service";
import {
  ProductMediaGalleryServiceDefinition,
  ProductMediaGalleryService,
} from "../../headless/store/product-media-gallery-service";

export class WixProductElement extends ContextProviderElement {
  static observedAttributes = ["product-slug"];

  private _productSlug: string | null = null;

  private getWixServicesManager() {
    if (typeof window !== "undefined" && window.wixClient) {
      // Try to access from wixClient
      return window.wixClient.servicesManager || window.wixClient;
    }

    // Fallback: try global modules
    if (typeof window !== "undefined") {
      const createServicesManager =
        window.createServicesManager ||
        (window as any)["@wix/services-manager"]?.createServicesManager;
      const createServicesMap =
        window.createServicesMap ||
        (window as any)["@wix/services-manager"]?.createServicesMap;

      if (createServicesManager && createServicesMap) {
        return { createServicesManager, createServicesMap };
      }
    }

    throw new Error(
      "Wix services manager not found. Make sure to include the Wix SDK initialization script."
    );
  }

  connectedCallback() {
    this.initializeServices();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "product-slug" && oldValue !== newValue) {
      this._productSlug = newValue;
      this.initializeServices();
    }
  }

  private async initializeServices() {
    const productSlug = this._productSlug || this.getAttribute("product-slug");

    if (!productSlug) {
      console.warn("wix-product requires a product-slug attribute");
      return;
    }

    const initPromise = this.loadAndInitializeServices(productSlug);
    this.setInitPromise(initPromise);

    try {
      await initPromise;
    } catch (error) {
      console.error("Failed to initialize product services:", error);
      this.dispatchEvent(
        new CustomEvent("product-error", {
          detail: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
          bubbles: true,
        })
      );
    }
  }

  private async loadAndInitializeServices(productSlug: string) {
    // Load product service config
    const productServiceConfig = await loadProductServiceConfig(productSlug);

    // Get Wix services from global scope
    const wixServices = this.getWixServicesManager();

    // Create services manager with all product-related services
    const servicesManager = wixServices.createServicesManager(
      wixServices
        .createServicesMap()
        .addService(
          ProductServiceDefinition,
          ProductService,
          productServiceConfig
        )
        .addService(
          SelectedVariantServiceDefinition,
          SelectedVariantService,
          productServiceConfig
        )
        .addService(
          ProductMediaGalleryServiceDefinition,
          ProductMediaGalleryService,
          productServiceConfig
        )
    );

    // Initialize context
    await this.initializeContext(servicesManager);

    // Dispatch product-ready event
    this.dispatchEvent(
      new CustomEvent("product-ready", {
        detail: { productSlug },
        bubbles: true,
      })
    );
  }

  get productSlug(): string | null {
    return this._productSlug || this.getAttribute("product-slug");
  }

  set productSlug(value: string | null) {
    if (value) {
      this.setAttribute("product-slug", value);
    } else {
      this.removeAttribute("product-slug");
    }
  }
}

// Define the custom element
customElements.define("wix-product", WixProductElement);
