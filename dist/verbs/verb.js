
/**
Definition of the Verb class.
@module verbs/verb
@license MIT. See LICENSE.md for details.
 */

(function() {
  var Class, EVENTS, HMEVENT, Promise, Verb;

  Class = require('../utils/class');

  EVENTS = require('events');

  HMEVENT = require('../core/event-codes');

  Promise = require('pinkie-promise');


  /**
  An instantiation of a HackMyResume command.
  @class Verb
   */

  Verb = module.exports = Class.extend({

    /** Constructor. Automatically called at creation. */
    init: function(moniker, workhorse) {
      this.moniker = moniker;
      this.workhorse = workhorse;
      this.emitter = new EVENTS.EventEmitter();
    },

    /** Invoke the command. */
    invoke: function() {
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
    },

    /** Forward subscriptions to the event emitter. */
    on: function() {
      return this.emitter.on.apply(this.emitter, arguments);
    },

    /** Fire an arbitrary event, scoped to "hmr:". */
    fire: function(evtName, payload) {
      payload = payload || {};
      payload.cmd = this.moniker;
      this.emitter.emit('hmr:' + evtName, payload);
      return true;
    },

    /** Handle an error condition. */
    err: function(errorCode, payload, hot) {
      payload = payload || {};
      payload.sub = payload.fluenterror = errorCode;
      payload["throw"] = hot;
      this.setError(errorCode, payload);
      if (payload.quit) {
        console.log(payload);
        this.reject(errorCode);
      }
      this.fire('error', payload);
      if (hot) {
        throw payload;
      }
      return true;
    },

    /** Fire the 'hmr:status' error event. */
    stat: function(subEvent, payload) {
      payload = payload || {};
      payload.sub = subEvent;
      this.fire('status', payload);
      return true;
    },
    hasError: function() {
      return this.errorCode || this.errorObj;
    },

    /** Associate error info with the invocation. */
    setError: function(code, obj) {
      this.errorCode = code;
      this.errorObj = obj;
    }
  });

}).call(this);

//# sourceMappingURL=verb.js.map
