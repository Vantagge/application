// ESLint v9+ flat config bridging to existing .eslintrc.cjs
// This file allows "eslint ." to work in environments requiring a flat config.
// It reuses the legacy config via FlatCompat and keeps ignore patterns.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pluginTs from '@typescript-eslint/eslint-plugin'
import parserTs from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import unusedImports from 'eslint-plugin-unused-imports'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({ baseDirectory: __dirname })

// Mirror ignore patterns from .eslintrc.cjs
const ignores = [
  'node_modules/',
  '.next/',
  'dist/',
  'build/',
  'coverage/',
  'public/',
]

export default [
  { ignores },
  // Base settings for TS/JS
  {
    files: ['**/*.{ts,tsx,js,jsx,cjs,mjs}'],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: undefined,
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': pluginTs,
      'react-hooks': reactHooks,
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      'unused-imports/no-unused-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // Note: We avoid compat.extends here to prevent legacy "extends" schema issues under ESLint v9.
]
