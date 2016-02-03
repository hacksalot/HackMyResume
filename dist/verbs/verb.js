
/**
Definition of the Verb class.
@module verbs/verb
@license MIT. See LICENSE.md for details.
 */

(function() {
  var EVENTS, HMEVENT, Promise, Verb;

  EVENTS = require('events');

  HMEVENT = require('../core/event-codes');

  Promise = require('pinkie-promise');


  /**
  An abstract invokable verb.
  Provides base class functionality for verbs. Provide common services such as
  error handling, event management, and promise support.
  @class Verb
   */

  module.exports = Verb = (function() {

    /** Constructor. Automatically called at creation. */
    function Verb(moniker, workhorse) {
      this.moniker = moniker;
      this.workhorse = workhorse;
      this.emitter = new EVENTS.EventEmitter();
      return;
    }


    /** Invoke the command. */

    Verb.prototype.invoke = function() {
      var argsArray, that;
      this.stat(HMEVENT.begin, {
        cmd: this.moniker
      });
      argsArray = Array.prototype.slice.call(arguments);
      that = this;
      return this.promise = new Promise(function(res, rej) {
        that.resolve = res;
        that.reject = rej;
        that.workhorse.apply(that, argsArray);
      });
    };


    /** Forward subscriptions to the event emitter. */

    Verb.prototype.on = function() {
      return this.emitter.on.apply(this.emitter, arguments);
    };


    /** Fire an arbitrary event, scoped to "hmr:". */

    Verb.prototype.fire = function(evtName, payload) {
      payload = payload || {};
      payload.cmd = this.moniker;
      this.emitter.emit('hmr:' + evtName, payload);
      return true;
    };


    /** Handle an error condition. */

    Verb.prototype.err = function(errorCode, payload, hot) {
      payload = payload || {};
      payload.sub = payload.fluenterror = errorCode;
      payload["throw"] = hot;
      this.setError(errorCode, payload);
      if (payload.quit) {
        this.reject(errorCode);
      }
      this.fire('error', payload);
      if (hot) {
        throw payload;
      }
      return true;
    };


    /** Fire the 'hmr:status' error event. */

    Verb.prototype.stat = function(subEvent, payload) {
      payload = payload || {};
      payload.sub = subEvent;
      this.fire('status', payload);
      return true;
    };


    /** Has an error occurred during this verb invocation? */

    Verb.prototype.hasError = function() {
      return this.errorCode || this.errorObj;
    };


    /** Associate error info with the invocation. */

    Verb.prototype.setError = function(code, obj) {
      this.errorCode = code;
      this.errorObj = obj;
    };

    return Verb;

  })();

}).call(this);

//# sourceMappingURL=verb.js.map
