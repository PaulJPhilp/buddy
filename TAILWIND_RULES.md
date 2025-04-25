# Tailwind 4 Configuration Guide

## Core Principles

1. **Package Management**
   - Use `@tailwindcss/postcss` instead of `tailwindcss`
   - Install with Bun: `bun add -d @tailwindcss/postcss`
   - Remove any references to `tailwindcss` from package.json

2. **PostCSS Configuration**
   ```javascript
   // postcss.config.js
   export default {
     plugins: {
       '@tailwindcss/postcss': {},
       autoprefixer: {},
     },
   }
   ```

3. **Tailwind Configuration**
   - Use ESM imports in `tailwind.config.ts`
   - Include alpha values in color definitions
   - Configure content paths for all relevant directories

   ```typescript
   // tailwind.config.ts
   import type { Config } from 'tailwindcss'
   import animate from 'tailwindcss-animate'
   import typography from '@tailwindcss/typography'
   import forms from '@tailwindcss/forms'

   const config: Config = {
     content: [
       './src/**/*.{js,ts,jsx,tsx,mdx}',
       './components/**/*.{js,ts,jsx,tsx,mdx}',
     ],
     theme: {
       extend: {
         colors: {
           // Use alpha values in color definitions
           primary: 'hsl(var(--primary) / <alpha>)',
           // ... other colors
         },
       },
     },
     plugins: [animate, typography, forms],
   }

   export default config
   ```

4. **CSS Variables**
   - Define CSS variables in `globals.css`
   - Use HSL color format for better alpha value support
   - Include both light and dark theme variables

   ```css
   @layer base {
     :root {
       --background: 0 0% 100%;
       --foreground: 222.2 84% 4.9%;
       /* ... other variables */
     }

     .dark {
       --background: 222.2 84% 4.9%;
       --foreground: 210 40% 98%;
       /* ... other variables */
     }
   }
   ```

5. **Plugin Usage**
   - Use official Tailwind plugins from `@tailwindcss/*` namespace
   - Configure plugins in `tailwind.config.ts`
   - Keep plugins up to date with Tailwind 4 compatibility

6. **Build Configuration**
   - Remove any Bun-specific Tailwind plugins
   - Ensure proper content paths in configuration
   - Use proper module resolution in build tools

7. **Development Workflow**
   - Run development server with `bun run dev`
   - Use proper content paths for JIT compilation
   - Monitor build output for configuration issues

## Common Issues and Solutions

1. **PostCSS Plugin Errors**
   - Ensure `@tailwindcss/postcss` is installed
   - Remove any references to `tailwindcss`
   - Check PostCSS configuration format

2. **Color Alpha Issues**
   - Use HSL color format
   - Include `<alpha>` value in color definitions
   - Define proper CSS variables

3. **Build Configuration**
   - Remove Bun-specific Tailwind plugins
   - Update content paths in configuration
   - Check module resolution settings

## Best Practices

1. **Color System**
   - Use HSL for all color definitions
   - Include alpha values in color utilities
   - Define semantic color variables

2. **Theme Configuration**
   - Use CSS variables for theme values
   - Support both light and dark themes
   - Define consistent color scales

3. **Plugin Management**
   - Use official Tailwind plugins
   - Keep plugins up to date
   - Configure plugins properly

4. **Build Optimization**
   - Configure proper content paths
   - Use JIT compilation
   - Monitor build output

## Migration Guide

1. **From Tailwind 3 to 4**
   - Replace `tailwindcss` with `@tailwindcss/postcss`
   - Update PostCSS configuration
   - Add alpha values to color definitions
   - Update plugin configurations
   - Remove Bun-specific Tailwind plugins

2. **Configuration Updates**
   - Update content paths
   - Configure proper module resolution
   - Update plugin configurations
   - Add alpha value support

3. **Build System Updates**
   - Remove Bun-specific Tailwind plugins
   - Update build configuration
   - Configure proper content paths
   - Update module resolution 