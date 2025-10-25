const path = require('path');

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ['airbnb-typescript/base', 'plugin:prettier/recommended'],
  rules: {
    '@typescript-eslint/camelcase': 0,
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    'unused-imports/no-unused-imports': 'error',
    'no-underscore-dangle': ['off', { allow: ['_id'] }],
    'max-len': ['off', { code: 140 }],
    'import/prefer-default-export': 0,
    'prettier/prettier': 'error',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/naming-convention': 'warn',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: path.resolve(__dirname, 'tsconfig.json'), // 절대 경로로 변경
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'unused-imports'],
  settings: {
    'import/resolver': {
      node: {
        paths: [path.resolve(__dirname, 'src')],
      },
    },
  },
  ignorePatterns: ['.eslintrc.js'],
};
