#! /usr/bin/env node

/**
Command-line interface (CLI) for FluentCMD via Node.js.
@license Copyright (c) 2015 | James M. Devlin
*/

var ARGS = require( 'minimist' )
  , FCMD  = require( './fluentcmd')
  , PKG = require('../package.json');

try {
  console.log( '*** FluentCMD v' + PKG.version + ' ***' );
  if( process.argv.length <= 2 ) { throw { fluenterror: 3 }; }
  var args = ARGS( process.argv.slice(2) );
  var src = args._.filter( function( a ) { return a.match(/\.json$/); });
  var dst = args._.filter( function( a ) { return !a.match(/\.json$/); });
  FCMD.generate( src, dst, args.t || 'informatic' );
  process.platform !== 'win32' && console.log('\n');
}
catch( ex ) {

  var msg = '';
  if( ex.fluenterror ){
    switch( ex.fluenterror ) {
      case 1: msg = "The specified theme couldn't be found: " + ex.data; break;
      case 2: msg = "Couldn't copy CSS file to destination folder"; break;
      case 3: msg = "Please specify a valid JSON resume file."; break;
    };
  }
  else {
    msg = ex.toString();
  }

  var idx = msg.indexOf('Error: ');
  var trimmed = idx === -1 ? msg : msg.substring( idx + 7 );
  console.log( 'ERROR: ' + trimmed.toString() );
}
