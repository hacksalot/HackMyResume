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

  require('./cli/error-handler').err( ex, true );

}
