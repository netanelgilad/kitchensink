# Wix Kitchensink

A comprehensive showcase of Wix platform features with working implementations, interactive examples, and comprehensive documentation. Built with Astro, React, and TypeScript.

## Features

- **Members Management** - Complete authentication, profile management, and member data handling
- **File Uploads** - Profile photo upload with drag & drop support
- **Reactive Architecture** - Client-side services with headless components pattern
- **Server Integration** - Astro Actions for secure server-side operations
- **📚 Interactive Documentation** - Inline docs mode with component discovery

## 📚 Interactive Documentation System

This project features a unique **docs mode** that lets you explore headless components directly within the application:

### How it Works

1. **Click the docs button** (📄 icon) next to the navigation menu
2. **Enter docs mode** - headless components are highlighted with blue borders
3. **Click any highlighted component** to open its documentation in a drawer
4. **Browse discovered components** in the floating components list

### Features

- **Component Discovery** - Automatically finds and highlights headless components on each page
- **Real-time Documentation** - Click components to see their docs, props, and usage examples
- **Framework Documentation** - Comprehensive guides on the architecture and patterns
- **Implementation Examples** - See how components are used in real applications

### Documentation Sections

- **Architecture & Patterns** - Core concepts and design principles
- **Headless Components** - Individual component documentation with examples
- **Client-Side Services** - State management and business logic services
- **Examples & Use Cases** - Complete implementations and patterns

## Architecture

This project uses a unique **Client-Side Services & Headless Components** architecture:

### Client-Side Services

- Reactive state management using Signals
- Business logic encapsulation
- Server-side integration through Astro Actions
- Service dependencies and composition

### Headless Components

- Render prop pattern for maximum flexibility
- Complete separation of logic and presentation
- Composable and reusable across different UIs
- Type-safe interfaces throughout

### Benefits

- **Reusability** - Services work across different UI implementations
- **Testability** - Clear boundaries between logic and presentation
- **Maintainability** - Changes to business logic don't affect UI
- **Performance** - Reactive updates only re-render affected components

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/wix-kitchensink

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:4321
```

### Exploring with Docs Mode

1. Navigate to `/members` when running the app
2. Click the docs button (📄) next to the hamburger menu
3. Click on any highlighted component to see its documentation
4. Explore the complete documentation at `/docs`

## Project Structure

```
src/
├── pages/                    # Astro pages
│   ├── docs/                # Documentation (MDX files)
│   └── members/             # Example member pages
├── react-pages/             # React page components
├── headless/                # Headless components & services
│   └── members/             # Member-related headless components
├── components/              # UI components
│   └── DocsMode.tsx         # Documentation system
├── layouts/                 # Layout components
└── styles/                  # Global styles
```

## Contributing

This project serves as both a learning resource and a reference implementation. Contributions are welcome!

### Adding New Features

1. **Create the service** in `src/headless/[domain]/`
2. **Add headless components** using the render prop pattern
3. **Create documentation** in `src/pages/docs/`
4. **Add docs wrappers** for component discovery
5. **Update examples** and implementation guides

### Documentation

All headless components should include:

- Comprehensive TypeScript interfaces
- Usage examples with multiple scenarios
- Integration patterns and best practices
- Testing strategies and examples

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with 💜 by the Wix Developer Experience Team**

_This project showcases the power of Wix's platform combined with modern web development practices. It's designed to be both educational and practical, providing real implementations you can learn from and build upon._
