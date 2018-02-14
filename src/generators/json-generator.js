/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the JsonGenerator class.
@module generators/json-generator
@license MIT. See LICENSE.md for details.
*/

let JsonGenerator;
const BaseGenerator = require('./base-generator');
const FS = require('fs');
const _ = require('underscore');
const FJCV = require('fresh-jrs-converter');

/** The JsonGenerator generates a FRESH or JRS resume as an output. */

module.exports = (JsonGenerator = class JsonGenerator extends BaseGenerator {

  constructor() { super('json'); }

  invoke( rez ) {
    let altRez = FJCV[ `to${rez.format() === 'FRESH' ? 'JRS' : 'FRESH'}` ](rez);
    return altRez = FJCV.toSTRING( altRez );
  }
    //altRez.stringify()

  generate( rez, f ) {
    FS.writeFileSync(f, this.invoke(rez), 'utf8');
  }
});
