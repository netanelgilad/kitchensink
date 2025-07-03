import { getServiceFromContext } from "./context-provider";

export abstract class ConsumerElement extends HTMLElement {
  protected abstract providerTagName: string;
  private _isInitialized = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._isInitialized = true;
    this.initializeComponent();
  }

  disconnectedCallback() {
    this._isInitialized = false;
    this.cleanup();
  }

  protected abstract initializeComponent(): Promise<void>;

  protected cleanup() {
    // Override in subclasses if cleanup is needed
  }

  protected async getService<T>(serviceDefinition: any): Promise<T | null> {
    return getServiceFromContext<T>(
      this,
      this.providerTagName,
      serviceDefinition
    );
  }

  protected createStyleSheet(css: string): CSSStyleSheet {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    return sheet;
  }

  protected adoptStyleSheets(sheets: CSSStyleSheet[]) {
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = sheets;
    }
  }

  protected renderContent(html: string) {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = html;
    }
  }

  protected updateContent(selector: string, content: string) {
    if (this.shadowRoot) {
      const element = this.shadowRoot.querySelector(selector);
      if (element) {
        element.textContent = content;
      }
    }
  }

  protected updateHTML(selector: string, html: string) {
    if (this.shadowRoot) {
      const element = this.shadowRoot.querySelector(selector);
      if (element) {
        element.innerHTML = html;
      }
    }
  }

  protected updateAttribute(
    selector: string,
    attribute: string,
    value: string | null
  ) {
    if (this.shadowRoot) {
      const element = this.shadowRoot.querySelector(selector);
      if (element) {
        if (value === null) {
          element.removeAttribute(attribute);
        } else {
          element.setAttribute(attribute, value);
        }
      }
    }
  }

  protected addClass(selector: string, className: string) {
    if (this.shadowRoot) {
      const element = this.shadowRoot.querySelector(selector);
      if (element) {
        element.classList.add(className);
      }
    }
  }

  protected removeClass(selector: string, className: string) {
    if (this.shadowRoot) {
      const element = this.shadowRoot.querySelector(selector);
      if (element) {
        element.classList.remove(className);
      }
    }
  }

  protected toggleClass(selector: string, className: string, force?: boolean) {
    if (this.shadowRoot) {
      const element = this.shadowRoot.querySelector(selector);
      if (element) {
        element.classList.toggle(className, force);
      }
    }
  }
}
