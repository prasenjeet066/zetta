'use strict';

class Environment {
  constructor(outer = null) {
    this.store = Object.create(null);
    this.outer = outer;
  }

  get(name) {
    if (Object.prototype.hasOwnProperty.call(this.store, name)) return this.store[name];
    if (this.outer) return this.outer.get(name);
    return undefined;
  }

  set(name, value) {
    this.store[name] = value;
    return value;
  }
}

function newEnclosedEnvironment(outer) { return new Environment(outer); }

module.exports = { Environment, newEnclosedEnvironment };

