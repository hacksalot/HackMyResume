/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the Verb class.
@module verbs/verb
@license MIT. See LICENSE.md for details.
*/



const EVENTS = require('events');
const HMEVENT = require('../core/event-codes');
const Promise = require('pinkie-promise');



/**
An abstract invokable verb.
Provides base class functionality for verbs. Provide common services such as
error handling, event management, and promise support.
@class Verb
*/

class Verb {



  /** Constructor. Automatically called at creation. */
  constructor( moniker, workhorse ) {
    this.moniker = moniker;
    this.workhorse = workhorse;
    this.emitter = new EVENTS.EventEmitter();
  }



  /** Invoke the command. */
  invoke() {

    // Sent the 'begin' notification for this verb
    this.stat(HMEVENT.begin, {cmd: this.moniker});

    // Prepare command arguments
    const argsArray = Array.prototype.slice.call(arguments);

    // Create a promise for this verb instance
    const that = this;
    return this.promise = new Promise(function(res, rej) {
      that.resolve = res;
      that.reject = rej;
      that.workhorse.apply(that, argsArray);
    });
  }



  /** Forward subscriptions to the event emitter. */
  on() { return this.emitter.on.apply(this.emitter, arguments); }



  /** Fire an arbitrary event, scoped to "hmr:". */
  fire(evtName, payload) {
    payload = payload || { };
    payload.cmd = this.moniker;
    this.emitter.emit(`hmr:${evtName}`, payload);
    return true;
  }



  /** Handle an error condition. */
  err( errorCode, payload, hot ) {
    payload = payload || { };
    payload.sub = (payload.fluenterror = errorCode);
    payload.throw = hot;
    this.setError(errorCode, payload);
    if (payload.quit) {
      this.reject(errorCode);
    }
    this.fire('error', payload);
    if (hot) {
      throw payload;
    }
    return true;
  }



  /** Fire the 'hmr:status' error event. */
  stat( subEvent, payload ) {
    payload = payload || { };
    payload.sub = subEvent;
    this.fire('status', payload);
    return true;
  }



  /** Has an error occurred during this verb invocation? */
  hasError() { return this.errorCode || this.errorObj; }



  /** Associate error info with the invocation. */
  setError( code, obj ) {
    this.errorCode = code;
    this.errorObj = obj;
  }
}

module.exports = Verb;
