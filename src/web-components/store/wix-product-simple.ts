import { ConsumerElement } from "../core/consumer-element";

// Simple product components that work directly with Wix API
declare global {
  interface Window {
    wixStores: any;
  }
}

export class WixProductSimpleElement extends HTMLElement {
  static observedAttributes = ["product-slug"];

  private _productData: any = null;
  private _productSlug: string | null = null;

  connectedCallback() {
    this.loadProduct();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "product-slug" && oldValue !== newValue) {
      this._productSlug = newValue;
      this.loadProduct();
    }
  }

  private async loadProduct() {
    const productSlug = this._productSlug || this.getAttribute("product-slug");

    if (!productSlug) {
      console.warn("wix-product-simple requires a product-slug attribute");
      return;
    }

    try {
      // Access Wix stores from global scope
      if (typeof window !== "undefined" && window.wixStores) {
        const products = await window.wixStores.products
          .queryProducts()
          .eq("slug", productSlug)
          .find();

        if (products.items?.[0]) {
          this._productData = products.items[0];
          this.dispatchEvent(
            new CustomEvent("product-loaded", {
              detail: { product: this._productData },
              bubbles: true,
            })
          );
        } else {
          throw new Error("Product not found");
        }
      } else {
        throw new Error("Wix stores not available");
      }
    } catch (error) {
      console.error("Failed to load product:", error);
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

  getProductData() {
    return this._productData;
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

export class WixProductNameSimpleElement extends ConsumerElement {
  protected providerTagName = "wix-product-simple";

  static observedAttributes = ["fallback"];

  protected async initializeComponent(): Promise<void> {
    const styles = this.createStyleSheet(`
      :host {
        display: inline-block;
      }
      
      .product-name {
        margin: 0;
        font-size: inherit;
        font-weight: inherit;
        color: inherit;
      }
      
      .fallback {
        opacity: 0.7;
        font-style: italic;
      }
      
      .loading {
        opacity: 0.5;
      }
    `);

    this.adoptStyleSheets([styles]);

    this.renderContent(`
      <slot name="before"></slot>
      <span class="product-name loading" part="product-name">Loading...</span>
      <slot name="after"></slot>
    `);

    // Find the provider and listen for product data
    const provider = this.closest(
      "wix-product-simple"
    ) as WixProductSimpleElement;
    if (provider) {
      // Check if product is already loaded
      const productData = provider.getProductData();
      if (productData) {
        this.updateProductName(productData.name || null);
      }

      // Listen for product updates
      provider.addEventListener("product-loaded", (event: any) => {
        this.updateProductName(event.detail.product.name || null);
      });

      provider.addEventListener("product-error", () => {
        this.updateProductName(null);
      });
    } else {
      this.updateProductName(null);
    }
  }

  private updateProductName(name: string | null) {
    const nameElement = this.shadowRoot?.querySelector(".product-name");

    if (!nameElement) return;

    if (name) {
      nameElement.textContent = name;
      nameElement.className = "product-name";
      nameElement.setAttribute("data-has-name", "true");
    } else {
      const fallback = this.getAttribute("fallback") || "Product Name";
      nameElement.textContent = fallback;
      nameElement.className = "product-name fallback";
      nameElement.setAttribute("data-has-name", "false");
    }
  }
}

export class WixProductPriceSimpleElement extends ConsumerElement {
  protected providerTagName = "wix-product-simple";

  static observedAttributes = ["fallback", "show-currency"];

  protected async initializeComponent(): Promise<void> {
    const styles = this.createStyleSheet(`
      :host {
        display: inline-block;
      }
      
      .product-price {
        font-weight: bold;
        font-size: inherit;
        color: inherit;
      }
      
      .fallback {
        opacity: 0.7;
        font-style: italic;
      }
      
      .loading {
        opacity: 0.5;
      }
    `);

    this.adoptStyleSheets([styles]);

    this.renderContent(`
      <slot name="before"></slot>
      <span class="product-price loading" part="product-price">Loading...</span>
      <slot name="after"></slot>
    `);

    // Find the provider and listen for product data
    const provider = this.closest(
      "wix-product-simple"
    ) as WixProductSimpleElement;
    if (provider) {
      // Check if product is already loaded
      const productData = provider.getProductData();
      if (productData) {
        this.updatePrice(productData);
      }

      // Listen for product updates
      provider.addEventListener("product-loaded", (event: any) => {
        this.updatePrice(event.detail.product);
      });

      provider.addEventListener("product-error", () => {
        this.updatePrice(null);
      });
    } else {
      this.updatePrice(null);
    }
  }

  private updatePrice(product: any) {
    const priceElement = this.shadowRoot?.querySelector(".product-price");

    if (!priceElement) return;

    if (product?.priceData?.formatted?.price) {
      const price = product.priceData.formatted.price;
      const currency = product.priceData.currency;
      const showCurrency = this.getAttribute("show-currency") === "true";

      let priceDisplay = price;
      if (showCurrency && currency && !price.includes(currency)) {
        priceDisplay = `${price} ${currency}`;
      }

      priceElement.textContent = priceDisplay;
      priceElement.className = "product-price";
      priceElement.setAttribute("data-has-price", "true");
      priceElement.setAttribute("data-currency", currency || "USD");
    } else {
      const fallback = this.getAttribute("fallback") || "$0.00";
      priceElement.textContent = fallback;
      priceElement.className = "product-price fallback";
      priceElement.setAttribute("data-has-price", "false");
    }
  }
}

// Define the custom elements
customElements.define("wix-product-simple", WixProductSimpleElement);
customElements.define("wix-product-name-simple", WixProductNameSimpleElement);
customElements.define("wix-product-price-simple", WixProductPriceSimpleElement);
