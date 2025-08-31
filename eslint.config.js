const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // React Native globals
        __DEV__: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        global: 'readonly',
        process: 'readonly',
        // Browser-like globals (may be available in React Native)
        WebSocket: 'readonly',
        fetch: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        performance: 'readonly',
        localStorage: 'readonly',
        AsyncStorage: 'readonly',
        // Jest globals (for tests)
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      // General rules - more lenient for development
      'no-console': 'off', // Allow console in React Native
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-unused-vars': 'off', // Handled by TypeScript rule
      'no-async-promise-executor': 'warn',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      // TypeScript rules - more lenient
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for now
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
];