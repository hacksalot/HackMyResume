#! /usr/bin/env node



/**
Command-line interface (CLI) for HackMyResume.
@license MIT. See LICENSE.md for details.
@module index.js
*/



try {

  require('./cli/main')( process.argv );

}
catch( ex ) {

  console.log(ex);
  if(ex.stack) console.log(ex.stack);
  require('./cli/error').err( ex, true );

}
