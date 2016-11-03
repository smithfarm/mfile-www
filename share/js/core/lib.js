// ************************************************************************* 
// Copyright (c) 2014, SUSE LLC
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
// lib.js
//
"use strict";

define ([
    'jquery',
    'current-user',
    'prototypes'
], function (
    $,
    currentUser,
    prototypes
) {

    var heldObject = null;

    return {

        // clear the result line
        clearResult: function () {
            $('#result').css('text-align', 'left');
            $('#result').html('&nbsp;');
        },

        // given an object, hold (store) it
        // if called without argument, just return whatever object we are holding
        holdObject: function (obj) {
            if (obj) {
                console.log("Setting held object to ", obj);
                heldObject = obj;
            }
            return heldObject;
        },

        // give object a "haircut" by throwing out all properties
        // that do not appear in proplist
        hairCut: function (obj, proplist) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    if (proplist.indexOf(prop) !== -1) {
                        continue;
                    }
                    delete obj[prop];
                }
            }
            return obj;
        },

        // log events to browser JavaScript console
        logKeyPress: function (evt) {
            // console.log("WHICH: " + evt.which + ", KEYCODE: " + evt.keyCode);
        },

        // check current employee's privilege against a given ACL profile
        privCheck: function (p) {

            var cep = currentUser('priv'),
                r,
                yesno;

            if ( ! cep ) {
                console.log("Something is wrong: cannot determine priv level of current user!");
                return undefined;
            }

            if (p === 'passerby' && cep) {
                r = true;
                yesno = "Yes.";
            } else if (p === 'inactive' && (cep === 'inactive' || cep === 'active' || cep === 'admin')) {
                r = true;
                yesno = "Yes.";
            } else if (p === 'active' && (cep === 'active' || cep === 'admin')) {
                r = true;
                yesno = "Yes.";
            } else if (p === 'admin' && cep === 'admin') {
                r = true;
                yesno = "Yes.";
            } else {
                r = false;
                yesno = "No.";
            }

            console.log("Does " + cep + " user satisfy ACL " + p + "? " + yesno);
            return r;
        },

        // right pad a string with spaces 
        rightPadSpaces: function (toPad, padto) {
            var strToPad = ((toPad === null) ? '' : toPad).toString();
            console.log("Padding " + strToPad + " to " + padto + " spaces.");
            var sp = '&nbsp;',
                padSpaces = sp.repeat(padto - String(strToPad).length);
            return strToPad.concat(padSpaces);
        },

        // convert "YYYY-MM-DD HH:DD:SS+TZ" string into YYYY-MMM-DD
        readableDate: function (urd) {
            var ymd = urd.substr(
                    0, urd.indexOf(" ")
                ).split('-'),
                year,
                m,
                day,
                month;
            if (ymd.length !== 3) {
                return urd;
            }
            year = +ymd[0];
            m = +ymd[1];
            day = +ymd[2];
            if (m === 1) {
                month = "JAN";
            } else if (m === 2) {
                month = "FEB";
            } else if (m === 3) {
                month = "MAR";
            } else if (m === 4) {
                month = "APR";
            } else if (m === 5) {
                month = "MAY";
            } else if (m === 6) {
                month = "JUN";
            } else if (m === 7) {
                month = "JUL";
            } else if (m === 8) {
                month = "AUG";
            } else if (m === 9) {
                month = "SEP";
            } else if (m === 10) {
                month = "OCT";
            } else if (m === 11) {
                month = "NOV";
            } else if (m === 12) {
                month = "DEC";
            } else {
                return urd;
            }
            return year.toString() + "-" + month + "-" + day.toString();
        },

        // pause main thread for n milliseconds
        wait: function (ms) {
            var start = new Date().getTime();
            var end = start;
            while(end < start + ms) {
                end = new Date().getTime();
            }
        },

        // convert null to empty array
        forceArray: function (arr) {
            return (arr === null) ? [] : arr;
        },

        // generate string "n objects" based on array length
        genObjStr: function (len) {
            return (len === 1) ?
                '1 object' :
                len + " objects";
        }

    };
});

