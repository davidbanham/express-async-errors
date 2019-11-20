'use strict';

const { IncomingMessage, ServerResponse } = require('http');
const co = require('co');
const Layer = require('express/lib/router/layer');
const { Router } = require('express');

// eslint-disable-next-line func-names, no-empty-function
const GeneratorFunction = (function* () {}).constructor;

const isError = (arg) => arg instanceof Error;
const isGeneratorFunction = (arg) => arg instanceof GeneratorFunction;
const isRequest = (arg) => arg instanceof IncomingMessage;
const isResponse = (arg) => arg instanceof ServerResponse;
const noop = () => {};

function copyProps(source, dest) {
  return Object.keys(source).reduce((acc, key) => {
    const value = source[key];
    return Object.assign(acc, { [key]: value });
  }, dest);
}

function wrap(fn) {
  const newFn = function newFn(...args) {
    if (isGeneratorFunction(fn)) fn = co.wrap(fn);
    const ret = fn.apply(this, args);
    const predicates = [isError, isRequest, isResponse];
    const next = args.find((arg) => predicates.every((match) => !match(arg))) || noop;
    if (ret && ret.catch) ret.catch((err) => next(err));
    return ret;
  };
  Object.defineProperty(newFn, 'length', {
    value: fn.length,
    writable: false,
  });
  return copyProps(fn, newFn);
}

Object.defineProperty(Layer.prototype, 'handle', {
  enumerable: true,
  get() {
    return this.__handle;
  },
  set(fn) {
    fn = wrap(fn);
    this.__handle = fn;
  },
});

const originalParam = Router.prototype.constructor.param;
Router.prototype.constructor.param = function param(name, fn) {
  fn = wrap(fn);
  return originalParam.call(this, name, fn);
};
