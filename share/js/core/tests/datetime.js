// *************************************************************************
// Copyright (c) 2014-2017, SUSE LLC
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice,
// this list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright
// notice, this list of conditions and the following disclaimer in the
// documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of SUSE LLC nor the names of its contributors may be
// used to endorse or promote products derived from this software without
// specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
// *************************************************************************
//
// tests/datetime.js
//
"use strict";

define ([
    'QUnit',
    'datetime',
], function (
    QUnit,
    dt,
) {

    var date_valid = function (assert, d) {
            console.log("Entering date_valid() with argument", d);
            var r = dt.vetDate(d);
            assert.ok(r, "valid: " + d + " -> " + r);
        },
        date_invalid = function (assert, d) {
            console.log("Entering date_invalid() with argument", d);
            var r = dt.vetDate(d);
            assert.strictEqual(r, null, "invalid: " + d);
        };

    return function () {

        QUnit.test('date vetter function: zero components', function (assert) {
            date_valid(assert, ''); // empty string
            date_valid(assert, ' '); // space
            date_valid(assert, '   '); // several spaces
            date_valid(assert, '	'); // tab
            date_valid(assert, ' 	'); // space + tab
            date_valid(assert, '	  '); // tab + 2 spaces
        });

        QUnit.test('date vetter function: one component', function (assert) {
            date_valid(assert, '31');
            date_valid(assert, 31);
            date_valid(assert, ' 31');
            date_valid(assert, ' 	31');
            date_valid(assert, '31      ');
            date_invalid(assert, '32');
            date_invalid(assert, 32);
            date_valid(assert, "-1");
            date_valid(assert, -1);
            date_valid(assert, "-2");
            date_valid(assert, "+20 ");
            date_valid(assert, "0");
            date_valid(assert, 0);
            date_invalid(assert, "january");
            date_valid(assert, "january 1 ");
            date_valid(assert, "  1 january");
            date_invalid(assert, "foobar");
            date_invalid(assert, "  1 foobar");
            date_invalid(assert, "  foobar 1");
            date_invalid(assert, " *&áb");
            date_invalid(assert, " *&áb  3");
            date_valid(assert, " yesterday ");
            date_valid(assert, " today ");
            date_valid(assert, " TOMORROW ");
            date_valid(assert, " yesterday");
            date_valid(assert, " yestBAMBLATCH");
            date_valid(assert, " YEST****");
        });

        QUnit.test('date vetter function: two components', function (assert) {
            date_valid(assert, '2 31');
            date_valid(assert, '2-31');
            date_valid(assert, '  2 31');
            date_valid(assert, '  2-31');
            date_valid(assert, '2 31	');
            date_valid(assert, '2-31	');
            date_valid(assert, '  2 31	  	');
            date_valid(assert, '  2-31	  	');
            date_valid(assert, 'February 31');
            date_valid(assert, 'February-31');
            date_valid(assert, 'feb 31');
            date_valid(assert, 'feb-31');
            date_valid(assert, '31 feb');
            date_valid(assert, '31-feb');
            date_invalid(assert, '2 foo');
            date_invalid(assert, '2-foo');
            date_invalid(assert, '2 unor');
            date_invalid(assert, '2-unor');
            date_invalid(assert, '2. února');
            date_invalid(assert, 'february 5.5');
            date_valid(assert, 'dec 15');
            date_valid(assert, 'dec-15');
            date_valid(assert, '15    deception ');
            date_invalid(assert, 'dec 155');
            date_invalid(assert, '	-  ');
            date_invalid(assert, '	.  ');
            date_invalid(assert, ' 	/  ');
            date_invalid(assert, '3.1415927');
            date_valid(assert, '31-5');
            date_valid(assert, '5-31');
            date_valid(assert, '5-3');
            date_valid(assert, '5.3');
        });

        QUnit.test('date vetter function: three components', function (assert) {
            date_invalid(assert, 'February 31.');
            date_invalid(assert, 'February-31.');
            date_valid(assert, "2017 oct 15");
            date_valid(assert, "15 oct 2017");
            date_valid(assert, "2017 octopus 15");
            date_valid(assert, "15 octopus 2017");
            date_valid(assert, "2017 October 15");
            date_valid(assert, "15 October 2017");
            date_invalid(assert, "15 oct 20177");
            date_invalid(assert, "20177 oct 15");
            date_invalid(assert, "2017 octopus 0");
            date_invalid(assert, "0 octopus 1999");
            date_invalid(assert, "155 oct 2017");
            date_invalid(assert, 'Pi 3.1415927');
            date_valid(assert, '2017-SEP-30ll');
            date_valid(assert, '2017asdf*-SEP-30ll');
            date_valid(assert, '2017***-SEP-30ll');
        });

        QUnit.test('date vetter function: 4+ components', function (assert) {
            date_invalid(assert, "2017 oct 15 b");
            date_invalid(assert, "15 oct 2017 c");
            date_invalid(assert, '-	-  ');
            date_invalid(assert, '.	-  ');
            date_invalid(assert, ' .	/  ');
            date_invalid(assert, '15  -  deception ');
            date_invalid(assert, 'Pi is approximately 3.1415927');
        });
    };

});

