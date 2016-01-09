#! /usr/bin/env node



/**
Command-line interface (CLI) for HackMyResume.
@license MIT. Copyright (c) 2015 hacksalot (https://github.com/hacksalot)
@module index.js
*/




try {

  var main = require('./cli/main');
  main( process.argv );

}
catch( ex ) {

  require('./core/error-handler').err( ex, true );

}
