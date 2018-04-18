module.exports = {
  extends: 'eslint:recommended',
  env: {
    browser: true,
    es6: true
  },
  globals: {
    L: false,
    dat: false
  },
  rules: {
    'indent': [1, 2],
    'no-unused-vars': [1],
    'semi': [1, 'always'],
    'quotes': [1, 'single']
  }
};