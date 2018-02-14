/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Implementation of the 'create' verb for HackMyResume.
@module verbs/create
@license MIT. See LICENSE.md for details.
*/



const MKDIRP = require('mkdirp');
const PATH = require('path');
const Verb = require('../verbs/verb');
const _ = require('underscore');
const HMSTATUS = require('../core/status-codes');
const HMEVENT = require('../core/event-codes');



class CreateVerb extends Verb {

  constructor() { super('new', _create); }
}


module.exports = CreateVerb;



/** Create a new empty resume in either FRESH or JRS format. */
var _create = function( src, dst, opts ) {

  if (!src || !src.length) {
    this.err(HMSTATUS.createNameMissing, { quit: true });
    return null;
  }

  const results = _.map(src, function( t ) {
    if (opts.assert && this.hasError()) { return { }; }
    const r = _createOne.call(this, t, opts);
    if (r.fluenterror) {
      r.quit = opts.assert;
      this.err(r.fluenterror, r);
    }
    return r;
  }
  , this);

  if (this.hasError() && !opts.assert) {
    this.reject(this.errorCode);
  } else if (!this.hasError()) {
    this.resolve(results);
  }
  return results;
};



/** Create a single new resume */
var _createOne = function( t, opts ) {
  let ret, safeFmt;
  try {
    ret = null;
    safeFmt = opts.format.toUpperCase();
    this.stat(HMEVENT.beforeCreate, { fmt: safeFmt, file: t });
    MKDIRP.sync(PATH.dirname( t )); // Ensure dest folder exists;
    const RezClass = require(`../core/${safeFmt.toLowerCase()}-resume`);
    const newRez = RezClass.default();
    newRez.save(t);
    ret = newRez;
  } catch (err) {
    ret = {
      fluenterror: HMSTATUS.createError,
      inner: err
    };
  }
  finally {
    this.stat(HMEVENT.afterCreate, { fmt: safeFmt, file: t, isError: ret.fluenterror });
  }
  return ret;
};
