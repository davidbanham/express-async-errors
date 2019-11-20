'use strict';

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: 'airbnb-base',
  parserOptions: {
    sourceType: 'script'
  },
  rules: {
    strict: ['error', 'safe'],
    'no-underscore-dangle': 'off',
    'no-param-reassign': 'off',
    'no-unused-vars': ['error', { 'argsIgnorePattern': 'next|res|req|err' }],
    'func-names': ['error', 'always', { generators: 'never' }],
    'require-yield': 'off'
  }
};
