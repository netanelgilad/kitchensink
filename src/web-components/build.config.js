// Simple build configuration for web components
// This can be used with esbuild or rollup to create a single bundle

export default {
  input: './index.ts',
  output: {
    file: './dist/wix-web-components.js',
    format: 'iife',
    name: 'WixWebComponents',
    exports: 'named'
  },
  external: [
    // Wix dependencies should be available globally
    '@wix/stores',
    '@wix/services-manager',
    '@wix/services-definitions'
  ],
  globals: {
    '@wix/stores': 'Wix.Stores', 
    '@wix/services-manager': 'Wix.ServicesManager',
    '@wix/services-definitions': 'Wix.ServicesDefinitions'
  }
}; 