#! /usr/bin/env node

/**
Command-line interface (CLI) for HackMyResume.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk.
@module index.js
*/

var ARGS = require( 'minimist' )
  , FCMD  = require( './hackmycmd')
  , PKG = require('../package.json')
  , COLORS = require('colors')
  , FS = require('fs')
  , PATH = require('path')
  , HACKMYSTATUS = require('./core/status-codes')
  , opts = { }
  , title = ('\n*** HackMyResume v' + PKG.version + ' ***').bold.white
  , _ = require('underscore');



try {
  main();
}
catch( ex ) {
  handleError( ex );
}



function main() {

  // Colorize
  COLORS.setTheme({
    title: ['white','bold'],
    info: process.platform === 'win32' ? 'gray' : ['white','dim'],
    infoBold: ['white','dim'],
    warn: 'yellow',
    error: 'red',
    guide: 'yellow',
    status: 'gray',//['white','dim'],
    useful: 'green',
  });

  // Setup
  if( process.argv.length <= 2 ) { throw { fluenterror: 4 }; }
  var a = ARGS( process.argv.slice(2) );
  opts = getOpts( a );
  logMsg( title );

  // Get the action to be performed
  var params = a._.map( function(p){ return p.toLowerCase().trim(); });
  var verb = params[0];
  if( !FCMD.verbs[ verb ] ) {
    logMsg('Invalid command: "'.warn + verb.warn.bold + '"'.warn);
    return;
  }

  // Find the TO keyword, if any
  var splitAt = _.indexOf( params, 'to' );
  if( splitAt === a._.length - 1 ) {
    // 'TO' cannot be the last argument
    logMsg('Please '.warn + 'specify an output file'.warn.bold +
      ' for this operation or '.warn + 'omit the TO keyword'.warn.bold +
      '.'.warn );
    return;
  }

  // Massage inputs and outputs
  var src = a._.slice(1, splitAt === -1 ? undefined : splitAt );
  var dst = splitAt === -1 ? [] : a._.slice( splitAt + 1 );
  ( splitAt === -1 ) && src.length > 1 && dst.push( src.pop() ); // Allow omitting TO keyword
  var parms = [ src, dst, opts, logMsg ];

  // Invoke the action
  FCMD.verbs[ verb ].apply( null, parms );

}

function logMsg( msg ) {
  opts.silent || console.log( msg );
}

function getOpts( args ) {
  var noPretty = args.nopretty || args.n;
  noPretty = noPretty && (noPretty === true || noPretty === 'true');
  return {
    theme: args.t || 'modern',
    format: args.f || 'FRESH',
    prettify: !noPretty,
    silent: args.s || args.silent
  };
}

// TODO: refactor
function handleError( ex ) {
  var msg = '', exitCode;



  if( ex.fluenterror ){
    switch( ex.fluenterror ) { // TODO: Remove magic numbers

      case HACKMYSTATUS.themeNotFound:
        msg = "The specified theme couldn't be found: " + ex.data;
        break;

      case HACKMYSTATUS.copyCSS:
        msg = "Couldn't copy CSS file to destination folder";
        break;

      case HACKMYSTATUS.resumeNotFound:
        msg = 'Please '.guide + 'specify a valid input resume'.guide.bold +
          ' in FRESH or JSON Resume format.'.guide;
        break;

      case HACKMYSTATUS.missingCommand:
        msg = title + "\nPlease ".guide + "specify a command".guide.bold + " (".guide +
        Object.keys( FCMD.verbs ).map( function(v, idx, ar) {
          return (idx === ar.length - 1 ? 'or '.guide : '') +
            v.toUpperCase().guide;
        }).join(', '.guide) + ").\n\n".guide +
          FS.readFileSync( PATH.join(__dirname, 'use.txt'), 'utf8' ).info.bold;
        break;

      case HACKMYSTATUS.invalidCommand:
        msg = 'Please '.guide + 'specify the output resume file'.guide.bold +
          ' that should be created.'.guide;
        break;

      case HACKMYSTATUS.resumeNotFoundAlt:
        msg = 'Please '.guide + 'specify a valid input resume'.guide.bold +
          ' in either FRESH or JSON Resume format.'.guide;
        break;

      case HACKMYSTATUS.inputOutputParity:
        msg = 'Please '.guide + 'specify an output file name'.guide.bold +
          ' for every input file you wish to convert.'.guide;
        break;

      case HACKMYSTATUS.createNameMissing:
        msg = 'Please '.guide + 'specify the filename of the resume'.guide.bold +
          ' to create.'.guide;
        break;

    }
    exitCode = ex.fluenterror;

  }
  else {
    msg = ex.toString();
    exitCode = 4;
  }

  var idx = msg.indexOf('Error: ');
  var trimmed = idx === -1 ? msg : msg.substring( idx + 7 );
  if( !ex.fluenterror || ex.fluenterror < 3 ) { // TODO: magic #s
    console.log( ('ERROR: ' + trimmed.toString()).red.bold );
    console.log( ex.stack.gray);
  }
  else
    console.log( trimmed.toString() );

  process.exit( exitCode );

}
