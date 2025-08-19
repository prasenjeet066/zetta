'use strict';

class Obj {
  type() { return 'OBJ'; }
  inspect() { return '<object>'; }
}

class IntegerObj extends Obj {
  constructor(value) { super(); this.value = value; }
  type() { return 'INTEGER'; }
  inspect() { return String(this.value); }
}

class StringObj extends Obj {
  constructor(value) { super(); this.value = value; }
  type() { return 'STRING'; }
  inspect() { return JSON.stringify(this.value); }
}

class BooleanObj extends Obj {
  constructor(value) { super(); this.value = value; }
  type() { return 'BOOLEAN'; }
  inspect() { return this.value ? 'true' : 'false'; }
}

class NullObj extends Obj {
  type() { return 'NULL'; }
  inspect() { return 'null'; }
}

class ReturnValue extends Obj {
  constructor(value) { super(); this.value = value; }
  type() { return 'RETURN_VALUE'; }
  inspect() { return this.value.inspect(); }
}

class FunctionObj extends Obj {
  constructor(parameters, body, env) { super(); this.parameters = parameters; this.body = body; this.env = env; }
  type() { return 'FUNCTION'; }
  inspect() { return 'fn(' + this.parameters.map(p => p.toString()).join(', ') + ') { ' + this.body.toString() + ' }'; }
}

module.exports = {
  Obj,
  IntegerObj,
  StringObj,
  BooleanObj,
  NullObj,
  ReturnValue,
  FunctionObj
};

