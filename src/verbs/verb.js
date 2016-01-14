/**
Definition of the Verb class.
@module verb.js
@license MIT. See LICENSE.md for details.
*/



(function(){



  // Use J. Resig's nifty class implementation
  var Class = require( '../utils/class' )
    , EVENTS = require('events');




  /**
  An instantiation of a HackMyResume command.
  @class Verb
  */
  var Verb = module.exports = Class.extend({



    /**
    Constructor. Automatically called at creation.
    */
    init: function( moniker ) {
      this.moniker = moniker;
      this.emitter = new EVENTS.EventEmitter();
    },



    /**
    Forward subscriptions to the event emitter.
    */
    on: function() {
      this.emitter.on.apply( this.emitter, arguments );
    },



    /**
    Fire an arbitrary event, scoped to "hmr:".
    */
    fire: function(evtName, payload) {
      payload = payload || { };
      payload.cmd = this.moniker;
      this.emitter.emit( 'hmr:' + evtName, payload );
      return true;
    },



    /**
    Fire the 'hmr:error' error event.
    */
    err: function( errorCode, payload, hot ) {
      payload = payload || { };
      payload.sub = payload.fluenterror = errorCode;
      payload.throw = hot;
      this.fire('error', payload);
      if( hot ) throw payload;
      return true;
    },



    /**
    Fire the 'hmr:status' error event.
    */
    stat: function( subEvent, payload ) {
      payload = payload || { };
      payload.sub = subEvent;
      this.fire('status', payload);
      return true;
    }

  });

}());
