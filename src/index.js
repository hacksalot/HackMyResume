#! /usr/bin/env node

/**
Command-line interface (CLI) for FluentCMD via Node.js.
@license Copyright (c) 2015 | James M. Devlin
*/

var ARGS = require( 'minimist' )
  , FCMD  = require( './fluentcmd');

try {
  console.log( '*** FluentCMD v0.1.0 ***' );
  if( process.argv.length <= 2 ) { throw 'Please specify a JSON resume file.'; }
  var args = ARGS( process.argv.slice(2) );
  var src = args._.filter( function( a ) { return a.endsWith('.json'); });
  var dst = args._.filter( function( a ) { return !a.endsWith('.json'); });
  FCMD.generate( src, dst, args.t || 'informatic' );
  process.platform !== 'win32' && console.log('\n');
}
catch( ex ) {
  var msg = ex.toString();
  var idx = msg.indexOf('Error: ');
  var trimmed = idx === -1 ? msg : msg.substring( idx + 7 );
  console.log( 'ERROR: ' + trimmed.toString() );
}
