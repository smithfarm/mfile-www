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
// datetime.js
//
// Area for code that works with dates and times
//
"use strict";

define ([
    "lib",
], function (
    coreLib,
) {

    var //today = Object.create(Date.prototype),
        today = new Date(),

        canonicalizeMonth = function (m) {
            console.log("Entering canonicalizeMonth() with argument", m);
            var m = parseInt(m, 10),
                month = String(m);
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
            }
            return month;
        }, // canonicalizeMonth

        vetDateYYYYMMDD = function (ds) {
            console.log("Entering vetDateYYYYMMDD() with argument", ds);
            var y = parseInt(ds[0], 10),
                m = ds[1],
                d = parseInt(ds[2], 10),
                month;
            if (!coreLib.isInteger(y) || !coreLib.isInteger(d)) {
                console.log("Non-integer year or day-of-month");
                return null;
            }
            if (y < 0 || d < 0) {
                console.log("Negative year or day-of-month");
                return null;
            }
            if (y > 0 && y < 13) {
                d = parseInt(ds[0], 10);
                y = parseInt(ds[2], 10);
            }
            if (y < 1800 || y > 9999) {
                console.log("Year out of range");
                return null;
            }
            if (coreLib.isInteger(m)) {
                if (m < 1 || m > 12) {
                    console.log("Month out of range");
                    return null;
                }
                month = canonicalizeMonth(m);
            } else {
                month = String(m); // pass to server as-is
            }
            if (!coreLib.isInteger(d) || d < 1 || d > 31) {
                console.log("Day-of-month out of range");
                return null;
            }
            return String(y) + 
                   '-' +
                   month +
                   '-' +
                   String(d);
        }, // vetDateYYYYMMDD

        vetDateMMDD = function (ds) {
            console.log("Entering vetDateMMDD() with argument", ds);
            return vetDateYYYYMMDD([
                today.getFullYear(), ds[0], ds[1]
            ]);
        }, // vetDateMMDD

        vetDateDDMM = function (ds) {
            return vetDateYYYYMMDD([
                today.getFullYear(), ds[1], ds[0]
            ]);
        }, // vetDateDDMM

        vetDateDD = function (ds) {
            return vetDateYYYYMMDD([
                today.getFullYear(), today.getMonth() + 1, ds[0]
            ]);
        }, // vetDateDD

        vetDateNothing = function () {
            return vetDateYYYYMMDD([
                today.getFullYear(), today.getMonth() + 1, today.getDate()
            ]);
        } // vetDateNothing
        ;

    return {

        // convert "YYYY-MM-DD HH:DD:SS+TZ" string into YYYY-MMM-DD
        readableDate: function (urd) {
            var ymd = urd.substr(0, urd.indexOf(" ")).split('-'),
                year,
                m,
                day,
                month;
            if (ymd.length !== 3) {
                return urd;
            }
            year = parseInt(ymd[0], 10);
            m =    parseInt(ymd[1], 10);
            day =  parseInt(ymd[2], 10);
            month = canonicalizeMonth(m);
            return year.toString() + "-" + month + "-" + day.toString();
        }, // readableDate

        vetDateYYYYMMDD: vetDateYYYYMMDD,

        vetDateMMDD: vetDateMMDD,

        vetDateDD: vetDateDD,

        vetDate: function (d) {
            console.log("Entering vetDate() with argument", d);
            var td = String(d).trim(),
                tda = td.split(/-|\.|\/|\s+/);
            console.log("tda", tda);
            console.log("Identified " + tda.length + " date components");
            if (tda.length === 1 && !tda[0]) {
                return vetDateNothing();
            } else if (tda.length === 1) {
                return vetDateDD(tda);
            } else if (tda.length === 2) {
                if (coreLib.isInteger(tda[0]) && !coreLib.isInteger(tda[1])) {
                    return vetDateDDMM(tda);
                } else {
                    return vetDateMMDD(tda);
                }
            } else if (tda.length === 3) {
                return vetDateYYYYMMDD(tda);
            }
            return null;
        },

        vetDateRange: function (dr) {
            // should support ranges of dates (using a hyphen)
            // should support whole months (e.g. 2017 AUGUST, August 2017)
            // if year is omitted, assume current year
            // should trim all whitespace (leading, trailing, internal)
            // on success, returns e.g. { "2017-02-01", "2017-02-28" }
            // on failure, returns null
            // TBD
            var tdr = String(dr).trim();
            return "VETTED";
        },

        vetTimeRange: function (tr) {
            // should trim all whitespace (leading, trailing, internal)
            // on success, returns e.g. { "06:00", "07:30" }
            // on failure, returns null
            // TBD
            var ttr = String(tr).trim();
            return null;
        },

    };

});

