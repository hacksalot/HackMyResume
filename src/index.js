#! /usr/bin/env node

/**
Command-line interface (CLI) for FluentCV:CLI.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk.
*/

var ARGS = require( 'minimist' )
  , FCMD  = require( './fluentcmd')
  , PKG = require('../package.json')
  , opts = { }
  , title = ('*** FluentCV v' + PKG.version + ' ***').white.bold
  , _ = require('underscore');



try {
  main();
}
catch( ex ) {
  handleError( ex );
}



function main() {

  if( process.argv.length <= 2 ) { throw { fluenterror: 4 }; }
  var a = ARGS( process.argv.slice(2) );
  opts = getOpts( a );
  logMsg( title );

  // Get the action to be performed
  var params = a._.map( function(p){ return p.toLowerCase().trim(); });
  var verb = params[0];
  if( !FCMD.verbs[ verb ] ) {
    logMsg('Invalid command: "'.yellow + verb.yellow.bold + '"'.yellow);
    return;
  }

  // Get source and dest params
  var splitAt = _.indexOf( params, 'to' );
  if( splitAt === a._.length - 1 ) {
    // 'TO' cannot be the last argument
    logMsg('Please '.gray + 'specify an output file' + ' for this operation or '.gray + 'omit the TO keyword' + '.'.gray);
    return;
  }

  var src = a._.slice(1, splitAt === -1 ? undefined : splitAt );
  var dst = splitAt === -1 ? [] : a._.slice( splitAt + 1 );

  // Preload our params array
  //var dst = (a.o && ((typeof a.o === 'string' && [ a.o ]) || a.o)) || [];
  //dst = (dst === true) ? [] : dst; // Handle -o with missing output file
  var parms = [ src, dst, opts, logMsg ];

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
      case 3: msg = 'Please '.gray + 'specify a valid input resume' + ' in '.gray + 'FRESH' + ' or '.gray + 'JSON Resume' + ' format.'.gray; break;
      case 4: msg = title + "\nPlease specify a command (".gray +
        Object.keys( FCMD.verbs ).map( function(v, idx, ar) {
          return (idx === ar.length - 1 ? 'or '.gray : '')
            +  v.toUpperCase();
        }).join(', ') + ")";
        break;
      case 5: msg = "Please specify the name of the TARGET file to convert to.".gray;
    };
    exitCode = ex.fluenterror;
  }
  else {
    msg = ex.toString();
    exitCode = 4;
  }

  var idx = msg.indexOf('Error: ');
  var trimmed = idx === -1 ? msg : msg.substring( idx + 7 );
  if( !ex.fluenterror || ex.fluenterror < 3 )
    console.log( ('ERROR: ' + trimmed.toString()).red.bold );
  else
    console.log( trimmed.toString() );
  process.exit( exitCode );

}
