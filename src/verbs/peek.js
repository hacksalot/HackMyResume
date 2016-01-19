/**
Implementation of the 'peek' verb for HackMyResume.
@module verbs/peek
@license MIT. See LICENSE.md for details.
*/



(function(){



  var Verb = require('../verbs/verb')
    , _ = require('underscore')
    , __ = require('lodash')
    , safeLoadJSON = require('../utils/safe-json-loader')
    , HMSTATUS = require('../core/status-codes')
    , HMEVENT = require('../core/event-codes');



  var PeekVerb = module.exports = Verb.extend({

    init: function() {
      this._super('peek');
    },

    invoke: function() {
      this.stat( HMEVENT.begin, { cmd: 'peek' } );
      peek.apply( this, arguments );
      this.stat( HMEVENT.end );
    }

  });



  /**
  Peek at a resume, resume section, or resume field.
  */
  function peek( src, dst, opts ) {

    if(!src || !src.length) throw {fluenterror: HMSTATUS.resumeNotFound};

    var objPath = (dst && dst[0]) || '';

    _.each( src, function( t ) {

      // Fire the 'beforePeek' event 2nd, so we have error/warning/success
      this.stat( HMEVENT.beforePeek, { file: t, target: objPath } );

      // Load the input file JSON 1st
      var obj = safeLoadJSON( t );

      // Fetch the requested object path (or the entire file)
      var tgt;
      if( !obj.ex )
        tgt = objPath ? __.get( obj.json, objPath ) : obj.json;

      // Fire the 'afterPeek' event with collected info
      this.stat( HMEVENT.afterPeek, {
        file: t,
        requested: objPath,
        target: tgt,
        error: obj.ex
      });

      // safeLoadJSON can only return a READ error or a PARSE error
      if( obj.ex ) {
        var errCode = obj.ex.operation === 'parse' ? HMSTATUS.parseError : HMSTATUS.readError;
        if( errCode === HMSTATUS.readError )
          obj.ex.quiet = true;
        this.setError( errCode, obj.ex );
        this.err( errCode, obj.ex );
      }

    }, this);

  }



}());
