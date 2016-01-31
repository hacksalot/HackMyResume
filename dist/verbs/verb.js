
/**
Definition of the Verb class.
@module verbs/verb
@license MIT. See LICENSE.md for details.
 */

(function() {
  var Class, EVENTS, HMEVENT, Verb;

  Class = require('../utils/class');

  EVENTS = require('events');

  HMEVENT = require('../core/event-codes');


  /**
  An instantiation of a HackMyResume command.
  @class Verb
   */

  Verb = module.exports = Class.extend({

    /** Constructor. Automatically called at creation. */
    init: function(moniker, workhorse) {
      this.moniker = moniker;
      this.emitter = new EVENTS.EventEmitter();
      this.workhorse = workhorse;
    },

    /** Invoke the command. */
    invoke: function() {
      var ret;
      this.stat(HMEVENT.begin, {
        cmd: this.moniker
      });
      ret = this.workhorse.apply(this, arguments);
      this.stat(HMEVENT.end);
      return ret;
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

    /** Associate error info with the invocation. */
    setError: function(code, obj) {
      this.errorCode = code;
      this.errorObj = obj;
    }
  });

}).call(this);
