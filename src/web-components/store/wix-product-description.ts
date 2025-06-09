import { ConsumerElement } from "../core/consumer-element";
import { ProductServiceDefinition } from "../../headless/store/product-service";
import type { WixService } from "../types";

export class WixProductDescriptionElement extends ConsumerElement {
  protected providerTagName = "wix-product";
  private unsubscribe?: () => void;

  static observedAttributes = ["fallback", "max-length"];

  protected async initializeComponent(): Promise<void> {
    // Set up basic styles
    const styles = this.createStyleSheet(`
      :host {
        display: block;
      }
      
      .product-description {
        margin: 0;
        line-height: 1.5;
      }
      
      .fallback {
        opacity: 0.7;
        font-style: italic;
      }
      
      .loading {
        opacity: 0.5;
      }
      
      .hidden {
        display: none;
      }
    `);

    this.adoptStyleSheets([styles]);

    // Initial render
    this.renderContent(`
      <slot name="before"></slot>
      <div class="product-description loading" part="product-description">Loading...</div>
      <slot name="after"></slot>
    `);

    // Get service and subscribe to changes
    const service = await this.getService<any>(ProductServiceDefinition);

    if (service) {
      // Subscribe to product changes
      this.unsubscribe = service.product.subscribe((product: any) => {
        this.updateProductDescription(product?.description || null);
      });

      // Initial update
      const currentProduct = service.product.get();
      this.updateProductDescription(currentProduct?.description || null);
    } else {
      this.updateProductDescription(null);
    }
  }

  protected cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  private updateProductDescription(description: string | null) {
    const descElement = this.shadowRoot?.querySelector(
      ".product-description"
    ) as HTMLElement;

    if (!descElement) return;

    if (description) {
      const maxLength = parseInt(this.getAttribute("max-length") || "0");
      let processedDescription = description;

      // Truncate if max-length is specified
      if (maxLength > 0 && description.length > maxLength) {
        processedDescription = description.substring(0, maxLength) + "...";
      }

      // Check if description contains HTML
      const isHtml = description.includes("<") && description.includes(">");

      if (isHtml) {
        descElement.innerHTML = processedDescription;
      } else {
        descElement.textContent = processedDescription;
      }

      descElement.className = "product-description";
      descElement.setAttribute("data-has-description", "true");
      descElement.setAttribute("data-is-html", isHtml.toString());
      this.style.display = "block";
    } else {
      const fallback = this.getAttribute("fallback");

      if (fallback) {
        descElement.textContent = fallback;
        descElement.className = "product-description fallback";
        descElement.setAttribute("data-has-description", "false");
        descElement.setAttribute("data-is-html", "false");
        this.style.display = "block";
      } else {
        // Hide the component if no description and no fallback
        this.style.display = "none";
      }
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (
      (name === "fallback" || name === "max-length") &&
      oldValue !== newValue
    ) {
      const service = this.getService<any>(ProductServiceDefinition);
      service.then((s) => {
        if (s) {
          const currentProduct = s.product.get();
          this.updateProductDescription(currentProduct?.description || null);
        }
      });
    }
  }
}

// Define the custom element
customElements.define("wix-product-description", WixProductDescriptionElement);
