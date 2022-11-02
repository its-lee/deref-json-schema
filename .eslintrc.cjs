module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ['eslint:recommended'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    curly: ['error', 'all'],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-expressions': ['error', { allowTernary: true, allowShortCircuit: true }],
    'prettier/prettier': ['error', { singleQuote: true, endOfLine: 'auto' }],
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always'
      }
    ],
    'no-unused-vars': 'error'
  }
};
