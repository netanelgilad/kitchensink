import { ConsumerElement } from "../core/consumer-element";
import { SelectedVariantServiceDefinition } from "../../headless/store/selected-variant-service";

export class WixProductPriceElement extends ConsumerElement {
  protected providerTagName = "wix-product";
  private unsubscribe?: () => void;

  static observedAttributes = ["fallback", "show-currency"];

  protected async initializeComponent(): Promise<void> {
    // Set up basic styles
    const styles = this.createStyleSheet(`
      :host {
        display: inline-block;
      }
      
      .product-price {
        font-weight: bold;
        font-size: inherit;
        color: inherit;
      }
      
      .price-value {
        font-family: inherit;
      }
      
      .currency {
        font-size: 0.9em;
        opacity: 0.8;
      }
      
      .variant-indicator {
        font-size: 0.8em;
        opacity: 0.7;
        margin-left: 0.5em;
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
      <span class="product-price loading" part="product-price">
        <span class="price-value" part="price-value">Loading...</span>
      </span>
      <slot name="after"></slot>
    `);

    // Get service and subscribe to changes
    const service = await this.getService<any>(
      SelectedVariantServiceDefinition
    );

    if (service) {
      // Subscribe to price changes
      this.unsubscribe = service.currentPrice.subscribe((price: any) => {
        const currency = service.currency.get();
        const variant = service.currentVariant.get();
        this.updatePrice(price, currency, !!variant);
      });

      // Initial update
      const currentPrice = service.currentPrice.get();
      const currency = service.currency.get();
      const variant = service.currentVariant.get();
      this.updatePrice(currentPrice, currency, !!variant);
    } else {
      this.updatePrice(null, "USD", false);
    }
  }

  protected cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  private updatePrice(
    price: string | null,
    currency: string,
    isVariantPrice: boolean
  ) {
    const priceElement = this.shadowRoot?.querySelector(".product-price");
    const priceValueElement = this.shadowRoot?.querySelector(".price-value");

    if (!priceElement || !priceValueElement) return;

    if (price && price !== "$0.00") {
      const showCurrency = this.getAttribute("show-currency") === "true";

      // Build price display
      let priceDisplay = price;

      if (showCurrency && currency && !price.includes(currency)) {
        priceDisplay = `${price} ${currency}`;
      }

      priceValueElement.textContent = priceDisplay;
      priceElement.className = "product-price";

      // Add variant indicator if this is a variant price
      let existingIndicator =
        this.shadowRoot?.querySelector(".variant-indicator");
      if (isVariantPrice && !existingIndicator) {
        const indicator = document.createElement("span");
        indicator.className = "variant-indicator";
        indicator.textContent = "(variant)";
        indicator.setAttribute("part", "variant-indicator");
        priceElement.appendChild(indicator);
      } else if (!isVariantPrice && existingIndicator) {
        existingIndicator.remove();
      }

      priceElement.setAttribute("data-has-price", "true");
      priceElement.setAttribute(
        "data-is-variant-price",
        isVariantPrice.toString()
      );
      priceElement.setAttribute("data-currency", currency);
    } else {
      const fallback = this.getAttribute("fallback") || "$0.00";
      priceValueElement.textContent = fallback;
      priceElement.className = "product-price fallback";
      priceElement.setAttribute("data-has-price", "false");
      priceElement.setAttribute("data-is-variant-price", "false");
      priceElement.setAttribute("data-currency", currency);

      // Remove variant indicator
      const existingIndicator =
        this.shadowRoot?.querySelector(".variant-indicator");
      if (existingIndicator) {
        existingIndicator.remove();
      }
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (
      (name === "fallback" || name === "show-currency") &&
      oldValue !== newValue
    ) {
      const service = this.getService<any>(SelectedVariantServiceDefinition);
      service.then((s) => {
        if (s) {
          const price = s.currentPrice.get();
          const currency = s.currency.get();
          const variant = s.currentVariant.get();
          this.updatePrice(price, currency, !!variant);
        }
      });
    }
  }
}

// Define the custom element
customElements.define("wix-product-price", WixProductPriceElement);
