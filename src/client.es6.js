import querystring from 'querystring';
import App from './app';

class ClientApp extends App {
  constructor (props = {}) {
    super(props);

    this.state = props.state || {};
  }

  // Server uses express sessions; on the client, we'll persist state in memory.
  getState (prop) {
    if (prop) {
      return this.state[prop];
    } else if (typeof prop === 'undefined') {
      return this.state;
    }
  }

  setState (prop, val) {
    this.state[prop] = val;
    return val;
  }

  resetState (state) {
    this.state = state || {};
  }

  buildRequest (requestUrl) {
    let splitUrl = requestUrl.split('?');
    let query = {};
    let url = requestUrl || '/';

    let pathName = this.fullPathName();

    if (splitUrl.length > 1) {
      url = splitUrl[0] || '/';
      query = querystring.parse(splitUrl[1] || '');
    }

    let req = {
      url,
      query,
      path: url,
      method: 'GET',
      renderSynchronous: false,
      useCache: true,
      headers: {
        referer: pathName,
      },
      //noop
      set: () => { },
    };

    return req;
  }

  fullPathName () {
    return document.location.pathname + document.location.search;
  }
}

module.exports = ClientApp;
