/**
Abstract theme representation.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
*/

(function() {

  var FS = require('fs')
    , extend = require('../utils/extend')
    , validator = require('is-my-json-valid')
    , _ = require('underscore')
    , PATH = require('path')
    , EXTEND = require('../utils/extend')
    , moment = require('moment')
    , RECURSIVE_READ_DIR = require('recursive-readdir-sync');

  /**
  The Theme class is a representation of a FluentCV theme asset.
  @class Theme
  */
  function Theme() {

  }

  /**
  Open and parse the specified theme.
  */
  Theme.prototype.open = function( themeFolder ) {

    function friendlyName( val ) {
      val = val.trim().toLowerCase();
      var friendly = { yml: 'yaml', md: 'markdown', txt: 'text' };
      return friendly[val] || val;
    }

    // Open the theme.json file; should have the same name as folder
    this.folder = themeFolder;
    var pathInfo = PATH.parse( themeFolder );
    var themeFile = PATH.join( themeFolder, pathInfo.base + '.json' );
    var themeInfo = JSON.parse( FS.readFileSync( themeFile, 'utf8' ) );
    EXTEND( true, this, themeInfo );

    var formatsHash = { };

    // Iterate over all files in the theme folder, producing an array, fmts,
    // containing info for each file.
    var tplFolder = PATH.join( themeFolder, 'src' );
    var fmts = RECURSIVE_READ_DIR( tplFolder ).map(
      function( absPath ) {

        var pathInfo = PATH.parse(absPath);

        // If this file lives in a specific format folder within the theme,
        // such as "/latex" or "/html", then that format is the output format
        // for all files within the folder.
        var outFmt = '';
        var portion = pathInfo.dir.replace(tplFolder,'');
        if( portion && portion.trim() ) {
          var reg = /^(?:\/|\\)(html|latex|doc|pdf)(?:\/|\\)?/ig;
          var res = reg.exec( portion );
          res && (outFmt = res[1]);
        }

        // Otherwise, the output format is inferred from the filename, as in
        // compact-[outputformat].[extension], for ex, compact-pdf.html.
        if( !outFmt ) {
          var idx = pathInfo.name.lastIndexOf('-');
          outFmt = ( idx === -1 ) ? pathInfo.name : pathInfo.name.substr( idx + 1 )
        }

        // We should have a valid output format now
        formatsHash[ outFmt ] = formatsHash[outFmt] || { outFormat: outFmt, files: [] };

        var obj = {
          path: absPath,
          ext: pathInfo.ext.slice(1),
          title: friendlyName( outFmt ),
          pre: outFmt,
          // outFormat: outFmt || pathInfo.name,
          data: FS.readFileSync( absPath, 'utf8' ),
          css: null
        };

        // Add this file to the list of files for this format type.
        formatsHash[ outFmt ].files.push( obj );
        return obj;
      }
    );

    // Add freebie formats every theme gets
    formatsHash[ 'json' ] = { title: 'json', outFormat: 'json', pre: 'json', ext: 'json', path: null, data: null };
    formatsHash[ 'yml' ] = { title: 'yaml', outFormat: 'yml', pre: 'yml', ext: 'yml', path: null, data: null };

    // Now, get all the CSS files...
    this.cssFiles = fmts.filter(function( fmt ){ return fmt.ext === 'css'; });

    // ...and assemble information on them
    this.cssFiles.forEach(function( cssf ) {
      // For each CSS file, get its corresponding HTML file
      var idx = _.findIndex(fmts, function( fmt ) {
        return fmt.pre === cssf.pre && fmt.ext === 'html'
      });
      fmts[ idx ].css = cssf.data;
      fmts[ idx ].cssPath = cssf.path;
    });

    // Remove CSS files from the formats array
    fmts = fmts.filter( function( fmt) {
      return fmt.ext !== 'css';
    });

    // Create a hash out of the formats for this theme
    this.formats = formatsHash;

    // Set the official theme name
    this.name = PATH.parse( themeFolder ).name;

    return this;
  };

  /**
  Determine if the theme supports the specified output format.
  */
  Theme.prototype.hasFormat = function( fmt ) {
    return _.has( this.formats, fmt );
  };

  /**
  Determine if the theme supports the specified output format.
  */
  Theme.prototype.getFormat = function( fmt ) {
    return this.formats[ fmt ];
  };

  module.exports = Theme;

}());
