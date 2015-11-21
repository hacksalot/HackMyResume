#! /usr/bin/env node

/**
Command-line interface (CLI) for FluentCV:CLI.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk.
*/

var ARGS = require( 'minimist' )
  , FCMD  = require( './fluentcmd')
  , PKG = require('../package.json')
  , opts = { };



try {
  main();
}
catch( ex ) {
  handleError( ex );
}



function main() {

  // Setup
  var title = ('*** FluentCV v' + PKG.version + ' ***').bold;
  if( process.argv.length <= 2 ) { logMsg(title); throw { fluenterror: 4 }; }
  var a = ARGS( process.argv.slice(2) );
  opts = getOpts( a );
  logMsg( title );

  // Get the action to be performed
  var verb = a._[0].toLowerCase().trim();
  if( !FCMD.verbs[ verb ] ) {
    throw 'Invalid command: "' + verb + '"';
  }

  // Preload our params array
  var dst = (a.o && ((typeof a.o === 'string' && [ a.o ]) || a.o)) || [];
  dst = (dst === true) ? [] : dst; // Handle -o with missing output file
  var parms = [ a._.slice(1) || [], dst, opts, logMsg ];

  // Invoke the action
  FCMD.verbs[ verb ].apply( null, parms );

}

function logMsg( msg ) {
  opts.silent || console.log( msg );
}

function getOpts( args ) {
  var noPretty = args['nopretty'] || args.n;
  noPretty = noPretty && (noPretty === true || noPretty === 'true');
  return {
    theme: args.t || 'modern',
    prettify: !noPretty,
    silent: args.s || args.silent
  };
}

function handleError( ex ) {
  var msg = '', exitCode;
  if( ex.fluenterror ){
    switch( ex.fluenterror ) { // TODO: Remove magic numbers
      case 1: msg = "The specified theme couldn't be found: " + ex.data; break;
      case 2: msg = "Couldn't copy CSS file to destination folder"; break;
      case 3: msg = "Please specify a valid JSON resume file."; break;
      case 4: msg = "Please specify a valid command (GENERATE, VALIDATE, or CONVERT)."
    };
    exitCode = ex.fluenterror;
  }
  else {
    msg = ex.toString();
    exitCode = 4;
  }

  var idx = msg.indexOf('Error: ');
  var trimmed = idx === -1 ? msg : msg.substring( idx + 7 );
  console.log( ('ERROR: ' + trimmed.toString()).red.bold );
  process.exit( exitCode );

}
