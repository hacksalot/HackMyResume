/**
Event code definitions.
@module event-codes.js
@license MIT. See LICENSE.md for details.
*/



(function(){

  var val = 0;

  module.exports = {

    unknown:        0,
    unk:            0,

    begin:          1,
    end:            2,

    beforeRead:     3,
    afterRead:      4,

    beforeCreate:   5,
    bc:             5,

    afterCreate:    6,
    ac:             6,

    beforeTheme:    7,
    afterTheme:     8,

    beforeMerge:    9,
    afterMerge:     10,

    beforeGenerate: 11,
    afterGenerate:  12,

    beforeAnalyze: 13,
    afterAnalyze: 14,

    beforeConvert: 15,
    afterConvert: 16,

    verifyOutputs: 17,

    beforeParse: 18,
    afterParse: 19

  };



}());
