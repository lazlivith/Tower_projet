import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Exécuté AVANT l'import des modules — garantit que STRIPE_SECRET_KEY
    // est défini avant l'instanciation de `new Stripe(...)` au niveau module
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
