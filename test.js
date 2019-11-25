'use strict';

/* eslint-env mocha */

require('./index.js');
const express = require('express');
const supertest = require('supertest');
const assert = require('assert');

const last = (arr) => arr[arr.length - 1];

describe('express-async-errors', () => {
  it('should propagate route handler errors to error handler', () => {
    const app = express();

    app.get('/test', async () => {
      throw new Error('error');
    });

    app.use((err, req, res, next) => {
      res.status(495).end();
    });

    return supertest(app)
      .get('/test')
      .expect(495);
  });

  it('should propagate middleware errors to error handler', () => {
    const app = express();

    app.use(async () => {
      throw new Error('error');
    });

    app.get('/test', async () => {
      throw new Error('error');
    });

    app.use((err, req, res, next) => {
      res.status(495).end();
    });

    return supertest(app)
      .get('/test')
      .expect(495);
  });

  it('should propagate error middleware errors to error handler', () => {
    const app = express();

    app.get('/test', async () => {
      throw new Error('error');
    });

    app.use(async (err, req, res, next) => {
      throw new Error('error');
    });

    app.use((err, req, res, next) => {
      res.status(495).end();
    });

    return supertest(app)
      .get('/test')
      .expect(495);
  });

  it('should propagate param middleware errors to error handler', () => {
    const app = express();

    app.param('id', async () => {
      throw new Error('error');
    });

    app.get('/test/:id', async (err, req, next, id) => {
      throw new Error(`error ${id}`);
    });

    app.use((err, req, res, next) => {
      res.status(495).end();
    });

    return supertest(app)
      .get('/test/12')
      .expect(495);
  });

  it('should preserve the router stack for external routes', () => {
    const app = express();

    function swaggerize(item) {
      function describeRouterRoute(router, metaData) {
        const lastRoute = last(router.stack);
        const [verb] = Object.keys(lastRoute.route.methods);
        metaData.path = lastRoute.route.path;
        metaData.verb = verb;
        lastRoute.route.swaggerData = metaData;
        metaData.described = true;
      }

      function describe(metaData) {
        if (item.stack) {
          describeRouterRoute(item, metaData);
          return item;
        }
        describeRouterRoute(item._router, metaData);
        return item;
      }

      item.describe = describe;
    }

    const router = express.Router();
    swaggerize(router);

    router
      .get('/test', (req, res) => {
        res.status(200).end();
      })
      .describe({ hasDescription: true });

    app.use('/', router);

    const appRouteStack = app._router.stack;
    const someMiddlewareFunctionStack = last(appRouteStack);
    const innerStack = someMiddlewareFunctionStack.handle.stack;
    const routeData = innerStack[0].route.swaggerData;

    assert.ok(routeData);
    assert.equal(routeData.verb, 'get');
    assert.equal(routeData.hasDescription, true);
  });
});
