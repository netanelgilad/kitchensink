// Context provider base class for web components
// Equivalent to ServicesManagerProvider in React

// Access Wix modules from global scope (loaded via Wix SDK)
declare global {
  interface Window {
    wixClient: any;
    createServicesManager: any;
    createServicesMap: any;
  }
}

// Get services manager functions from global Wix context
const getWixServicesManager = () => {
  if (typeof window !== "undefined" && window.wixClient) {
    // Try to access from wixClient
    return window.wixClient.servicesManager || window.wixClient;
  }

  // Fallback: try global modules
  if (typeof window !== "undefined") {
    // @ts-ignore - Global modules from Wix SDK
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
};

// Define the services manager type
type ServicesManager = any;

export interface ServiceContext {
  servicesManager: ServicesManager;
}

export class ContextProviderElement extends HTMLElement {
  private _context: ServiceContext | null = null;
  private _initPromise: Promise<void> | null = null;

  constructor() {
    super();
  }

  protected async initializeContext(
    servicesManager: ServicesManager
  ): Promise<void> {
    this._context = { servicesManager };
    this.dispatchEvent(
      new CustomEvent("context-ready", {
        detail: this._context,
        bubbles: true,
      })
    );
  }

  public getContext(): ServiceContext | null {
    return this._context;
  }

  public async waitForContext(): Promise<ServiceContext> {
    if (this._context) {
      return this._context;
    }

    if (this._initPromise) {
      await this._initPromise;
      return this._context!;
    }

    // Wait for context-ready event
    return new Promise((resolve) => {
      const handler = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (event.target === this) {
          this.removeEventListener("context-ready", handler as EventListener);
          resolve(customEvent.detail);
        }
      };
      this.addEventListener("context-ready", handler as EventListener);
    });
  }

  protected setInitPromise(promise: Promise<void>): void {
    this._initPromise = promise;
  }
}

// Utility function for consumer components to find their context
export function findContextProvider(
  element: Element,
  providerTagName: string
): ContextProviderElement | null {
  return element.closest(providerTagName) as ContextProviderElement | null;
}

// Utility function to get service from context
export async function getServiceFromContext<T>(
  element: Element,
  providerTagName: string,
  serviceDefinition: any
): Promise<T | null> {
  const provider = findContextProvider(element, providerTagName);
  if (!provider) {
    console.warn(`No ${providerTagName} found for element`, element);
    return null;
  }

  try {
    const context = await provider.waitForContext();
    return context.servicesManager.getService(serviceDefinition) as T;
  } catch (error) {
    console.error("Failed to get service from context:", error);
    return null;
  }
}
