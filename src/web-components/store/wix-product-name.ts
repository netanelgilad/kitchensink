import { ConsumerElement } from "../core/consumer-element";
import { ProductServiceDefinition } from "../../headless/store/product-service";

export class WixProductNameElement extends ConsumerElement {
  protected providerTagName = "wix-product";
  private unsubscribe?: () => void;

  static observedAttributes = ["fallback"];

  protected async initializeComponent(): Promise<void> {
    // Set up basic styles
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

    // Initial render
    this.renderContent(`
      <slot name="before"></slot>
      <span class="product-name loading" part="product-name">Loading...</span>
      <slot name="after"></slot>
    `);

    // Get service and subscribe to changes
    const service = await this.getService<any>(ProductServiceDefinition);

    if (service) {
      // Subscribe to product changes
      this.unsubscribe = service.product.subscribe((product: any) => {
        this.updateProductName(product?.name || null);
      });

      // Initial update
      const currentProduct = service.product.get();
      this.updateProductName(currentProduct?.name || null);
    } else {
      this.updateProductName(null);
    }
  }

  protected cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
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

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "fallback" && oldValue !== newValue) {
      const service = this.getService<any>(ProductServiceDefinition);
      service.then((s) => {
        if (s) {
          const currentProduct = s.product.get();
          this.updateProductName(currentProduct?.name || null);
        }
      });
    }
  }
}

// Define the custom element
customElements.define("wix-product-name", WixProductNameElement);
