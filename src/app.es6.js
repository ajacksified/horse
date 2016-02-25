import { EventEmitter } from 'events';

// Import a simple router that works anywhere.
import Router from 'koa-router';

// Custom errors for fun and profit.
import RouteError from './routeError';

class App {
  constructor (config={}) {
    this.config = config;

    // The router listens to web requests (or html5 history changes) and fires
    // callbacks registered by plugins.
    this.router = new Router();
    this.emitter = new EventEmitter();

    this.plugins = [];
  }

  // A nicer-looking way to load config values.
  getConfig (c) {
    return this.config[c];
  }

  // Accepts routes / history changes, and forwards on the req object and
  // the response (a `defer` object). The last param, `function`, can be safely
  // ignored - it's fired after handling.
  async route (ctx, next) {
    const app = this;
    this.emit('route:start', ctx, ctx.req);

    let middleware = this.router.routes(ctx);

    let match = this.router.match(ctx.path).path.filter((r) => {
      return r.methods.includes(ctx.method);
    });

    if (!match.length) {
      return new Promise(function(resolve) {
        app.error(new RouteError(ctx.path), ctx, app);
        resolve();
      });
    }

    try {
      await middleware(ctx, next);
      this.emit('route:end', ctx);
    } catch (err) {
      if (this.config.debug) {
        console.log(err, err.stack);
      }

      this.error(err, ctx, app);
    }
  }

  registerPlugin (plugin) {
    if (this.plugins.indexOf(plugin) === -1) {
      this.plugins.push(plugin);
    }
  }

  emit (...args) {
    this.emitter.emit.apply(this.emitter, args);
  }

  on (...args) {
    this.emitter.on.apply(this.emitter, args);
  }

  off (...args) {
    this.emitter.removeListener.apply(this.emitter, args);
  }

  error (e, ctx) {
    let status = e.status || 500;
    let url = '/' + status;

    if (this.config.debug) {
      console.log(e, e.stack);
    }

    if (ctx.request.url !== url) {
      ctx.set('Cache-Control', 'no-cache');
      ctx.originalUrl = ctx.originalUrl || ctx.request.url;
      ctx.path = url;

      ctx.redirect(url);
    } else {
      // Critical failure! The error page is erroring! Abandon all hope
      console.log(e, e.stack);
    }
  }
}

export default App;
