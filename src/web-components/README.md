# Wix Web Components

Modern, reactive web components for Wix stores built on top of the existing headless components and client-side services architecture.

## 🚀 Features

- **Context-based architecture** - Components automatically find their data context using `.closest()`
- **Reactive updates** - Real-time data synchronization using Signals
- **CSS Parts styling** - Fully customizable with CSS parts and slots
- **Shadow DOM encapsulation** - No style conflicts
- **Framework agnostic** - Works with any web technology
- **TypeScript support** - Full type safety and intellisense
- **Single script bundle** - Easy to drop into any page

## 🏗️ Architecture

The web components layer sits on top of the existing React/Astro headless components architecture:

```
┌─────────────────────────────┐
│     Web Components          │ ← New layer
│   (DOM-based, CSS Parts)    │
├─────────────────────────────┤
│   Headless Components       │ ← Existing
│   (Render props pattern)    │
├─────────────────────────────┤
│   Client-Side Services      │ ← Existing
│   (Signals, state mgmt)     │
├─────────────────────────────┤
│   Wix SDK / APIs           │ ← Existing
└─────────────────────────────┘
```

### Context Provider Pattern

Instead of React's Context API, web components use DOM-based context discovery:

- **Context Providers** (e.g., `<wix-product>`) - Initialize services and make them available
- **Consumer Components** (e.g., `<wix-product-name>`) - Find context using `.closest()` and consume services
- **Service Discovery** - Components walk up the DOM tree to find their context provider

## 📦 Components

### Context Providers

#### `<wix-product>`

Initializes product-related services (ProductService, SelectedVariantService, ProductMediaGalleryService).

```html
<wix-product product-slug="your-product-slug">
  <!-- Consumer components go here -->
</wix-product>
```

**Attributes:**

- `product-slug` - The slug of the product to load

**Events:**

- `product-ready` - Fired when product data is loaded
- `product-error` - Fired when product loading fails

### Consumer Components

#### `<wix-product-name>`

Displays the product name.

```html
<wix-product-name fallback="Loading..."></wix-product-name>
```

**Attributes:**

- `fallback` - Text to show when no product name is available

**CSS Parts:**

- `product-name` - The main text element

**Data Attributes:**

- `data-has-name` - "true" if product has a name

#### `<wix-product-description>`

Displays the product description with HTML support.

```html
<wix-product-description fallback="No description available" max-length="150">
</wix-product-description>
```

**Attributes:**

- `fallback` - Text to show when no description is available
- `max-length` - Maximum characters to display (truncates with "...")

**CSS Parts:**

- `product-description` - The main description element

**Data Attributes:**

- `data-has-description` - "true" if product has a description
- `data-is-html` - "true" if description contains HTML

#### `<wix-product-price>`

Displays the current product price (includes variant pricing).

```html
<wix-product-price fallback="$0.00" show-currency="true"> </wix-product-price>
```

**Attributes:**

- `fallback` - Price to show when unavailable
- `show-currency` - "true" to display currency code

**CSS Parts:**

- `product-price` - The main price container
- `price-value` - The price text
- `variant-indicator` - Indicator when showing variant price

**Data Attributes:**

- `data-has-price` - "true" if product has a price
- `data-is-variant-price` - "true" if displaying variant-specific price
- `data-currency` - The currency code

## 🎨 Styling

Web components use Shadow DOM and CSS Parts for styling:

### Using CSS Parts

```css
/* Style the product name */
wix-product-name::part(product-name) {
  color: #ff6b6b;
  font-weight: bold;
  font-size: 2rem;
}

/* Style the price */
wix-product-price::part(product-price) {
  color: #51cf66;
  font-size: 1.5rem;
}

/* Style the variant indicator */
wix-product-price::part(variant-indicator) {
  background: #f1f3f4;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}
```

### Using Slots

Components support slots for custom content:

```html
<wix-product-price>
  <span slot="before">Special Price: </span>
  <span slot="after"> (Limited Time)</span>
</wix-product-price>
```

### Data Attributes

Use data attributes for conditional styling:

```css
/* Style when product has no name */
wix-product-name[data-has-name="false"] {
  opacity: 0.5;
}

/* Style variant prices differently */
wix-product-price[data-is-variant-price="true"]::part(product-price) {
  border: 2px solid #4dabf7;
}
```

## 🔧 Installation & Usage

### 1. Include Wix SDK

First, include the Wix SDK initialization script:

```html
<script src="https://unpkg.com/@wix/init-sdk-context/build/site.iife.js"></script>
```

### 2. Include Web Components Bundle

```html
<script src="./dist/wix-web-components.js"></script>
```

### 3. Use Components

```html
<wix-product product-slug="your-actual-product-slug">
  <h1><wix-product-name fallback="Product"></wix-product-name></h1>
  <p class="price"><wix-product-price fallback="$0.00"></wix-product-price></p>
  <div class="description">
    <wix-product-description
      fallback="No description available"
      max-length="200"
    >
    </wix-product-description>
  </div>
</wix-product>
```

## 🛠️ Development

### Building Components

```bash
# Install dependencies (if using npm/yarn)
npm install esbuild

# Build the bundle
node build.mjs
```

### Project Structure

```
src/web-components/
├── core/
│   ├── context-provider.ts    # Base context provider class
│   └── consumer-element.ts    # Base consumer element class
├── store/
│   ├── wix-product.ts        # Product context provider
│   ├── wix-product-name.ts   # Product name component
│   ├── wix-product-description.ts
│   └── wix-product-price.ts
├── index.ts                  # Main entry point
├── build.mjs                 # Build script
├── example.html             # Demo page
└── dist/
    └── wix-web-components.js # Built bundle
```

### Adding New Components

1. **Create Consumer Component:**

```typescript
// src/web-components/store/wix-new-component.ts
import { ConsumerElement } from "../core/consumer-element";
import { ServiceDefinition } from "../../headless/store/service";

export class WixNewComponentElement extends ConsumerElement {
  protected providerTagName = "wix-product";

  protected async initializeComponent(): Promise<void> {
    const service = await this.getService(ServiceDefinition);
    // Implementation here
  }
}

customElements.define("wix-new-component", WixNewComponentElement);
```

2. **Register in index.ts:**

```typescript
export * from "./store/wix-new-component";
import "./store/wix-new-component";
```

3. **Rebuild the bundle:**

```bash
node build.mjs
```

## 🧪 Testing

Open `example.html` in a browser to see the components in action. The demo includes:

- Multiple product examples
- CSS Parts styling examples
- Slot usage examples
- Error handling demonstrations
- Component status monitoring

## 🤝 Relationship to React/Astro Architecture

The web components **reuse the existing services without modification**:

- ✅ Same `ProductService`, `SelectedVariantService`, etc.
- ✅ Same reactive Signals for state management
- ✅ Same service configuration loading functions
- ✅ Same business logic and API interactions

**Key Differences:**

- **Context Discovery**: DOM-based `.closest()` instead of React Context
- **Rendering**: Shadow DOM + CSS Parts instead of JSX + render props
- **Lifecycle**: Custom Elements lifecycle instead of React lifecycle
- **Styling**: CSS Parts + slots instead of CSS-in-JS/styled-components

## 🚧 Limitations & Future Enhancements

### Current Limitations

- Product-focused components only (no cart, collection components yet)
- No variant selection components
- No media gallery components
- Basic error handling

### Planned Enhancements

- Add cart management components (`<wix-cart>`, `<wix-add-to-cart>`)
- Add collection/product grid components
- Add variant selection components
- Add media gallery components
- Enhanced error boundaries and loading states
- Performance optimizations
- Comprehensive test suite

## 📚 Resources

- [Web Components Standards](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [CSS Parts Specification](https://developer.mozilla.org/en-US/docs/Web/CSS/::part)
- [Custom Elements Lifecycle](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
- [Wix Stores API Documentation](https://dev.wix.com/api/rest/wix-stores)

## 🎯 Design Goals

1. **Zero JavaScript Required** - Developers only write HTML and CSS
2. **Progressive Enhancement** - Works with or without JavaScript frameworks
3. **Developer Experience** - Simple, intuitive APIs with great TypeScript support
4. **Performance** - Lazy loading, minimal bundle size, efficient updates
5. **Accessibility** - Semantic HTML, proper ARIA attributes, keyboard navigation
6. **Customizability** - Full control over styling without style conflicts
