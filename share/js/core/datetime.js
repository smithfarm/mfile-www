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
    "jquery",
    "lib",
], function (
    $,
    coreLib,
) {

    var mflt = [null, 'January', 'February', 'March', 'April', 'May',
                'June', 'July', 'August', 'September', 'October',
                'November', 'December'],

        mlo = {
            'j': 'January', 'ja': 'January', 'jan': 'January',
            'f': 'February', 'fe': 'February', 'feb': 'February',
            'mar': 'March',
            'a': 'April', 'ap': 'April', 'apr': 'April',
            'may': 'May',
            'jun': 'June',
            'jul': 'July',
            'a': 'August', 'au': 'August', 'aug': 'August',
            's': 'September', 'se': 'September', 'sep': 'September',
            'o': 'October', 'oc': 'October', 'oct': 'October',
            'n': 'November', 'no': 'November', 'nov': 'November',
            'd': 'December', 'de': 'December', 'dec': 'December',
        },

        mlt =  [null, 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL',
                'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],

        today = new Date(),

        addMinutes = function (date, minutes) {
            return new Date(date.getTime() + minutes*60000);
        },

        canonicalizeTime = function (rt) {
            // assume rt ("raw time") is a string with format "h[:m]" where h and
            // m are integers
            console.log("Entering canonicalizeTime() with argument", rt);

            var h,
                i,
                m,
                ct = [],
                rts = String(rt).split(":");

            if (rts.length < 1 || rts.length > 2) {
                return null;
            }
            if (rts.length === 1) {
                rts.push("0");
            }
            for (i = 0; i < 2; i += 1) {
                if (rts[i] === "") {
                    rts[i] = "0";
                }
            }
            if (! coreLib.isInteger(rts[0]) || ! coreLib.isInteger(rts[1])) {
                return null;
            }
            h = parseInt(rts[0], 10);
            m = parseInt(rts[1], 10);
            if (h < 0 || h > 24) {
                return null;
            }
            if (m < 0 || m > 59) {
                return null;
            }
            if (h === 24 && m !== 0) {
                return null;
            }
            // assemble canonicalized time string; left-pad with zero if necessary
            ct[0] = h;
            ct[1] = m;
            for (i = 0; i < 2; i += 1) {
                if (ct[i] < 10) {
                    ct[i] = "0" + String(ct[i]);
                } else {
                    ct[i] = String(ct[i]);
                }
            }
            return ct[0] + ":" + ct[1];
        },

        canonicalizeTimeRange = function (tr, opts) {
            console.log("Entering canonicalizeTimeRange() with argument", tr);
            var ttr = String(tr).trim().replace(/\s/g, ''),
                ttrs;
            opts = $.extend({"offset": true}, opts);
            if (/^\d*:{0,1}\d*-\d*:{0,1}\d*$/.test(ttr)) {
                console.log(tr + " is a standard time range");
                return canonicalizeTimeRangeStandard(ttr);
            } else if (/^\d+:{0,1}\d*\+\d+:{0,1}\d*/.test(ttr) && opts.offset) {
                console.log(tr + " is an offset time range");
                return canonicalizeTimeRangeOffset(ttr);
            } else if (/^\+\d+:{0,1}\d*/.test(ttr) && opts.offset) {
                console.log(tr + " is a last-interval-plus-offset time range");
                ttrs = canonicalizeTime(ttr.replace(/\+/g, ''));
                if (ttrs === null) {
                    return null;
                }
                return '+' + ttrs;
            } else if (ttr.match(/^\+$/)) {
                console.log(tr + " is a next-scheduled-interval time range");
                return ttr;
            }
            return null;
        },

        canonicalizeTimeRangeOffset = function (tr) {
            console.log("Entering canonicalizeTimeRangeOffset() with argument", tr);
            // on success, returns e.g. ["06:00", "07:30"]
            // on failure, returns null
            var i,
                ttrs = tr.split('+'),
                ftr = [],
                buf = [],
                baseMinutes,
                offsetMinutes;

            if (ttrs.length !== 2) {
                return null;
            }
            for (i = 0; i < 2; i += 1) {
                ftr[i] = canonicalizeTime(ttrs[i]);
                if (ftr[i] === null) {
                    return null;
                }
            }
            console.log("Canonicalized base time: " + ftr[0]);
            console.log("Canonicalized offset: " + ftr[1]);
            baseMinutes = timeToMinutes(ftr[0]);
            offsetMinutes = timeToMinutes(ftr[1]);
            console.log("Base minutes: " + baseMinutes);
            console.log("Base minutes: " + offsetMinutes);
            if (baseMinutes === null || offsetMinutes === null) {
                console.log("CRITICAL ERROR: problem with timeToMinutes", ftr);
                return null;
            }
            ftr[1] = minutesToTime(baseMinutes + offsetMinutes);
            if (ftr[1] === null) {
                return null;
            }
            return ftr;
        },

        canonicalizeTimeRangeStandard = function (tr) {
            // on success, returns e.g. ["06:00", "07:30"]
            // on failure, returns null
            var i,
                ttrs = tr.split('-'),
                ftr = [];

            if (ttrs.length !== 2) {
                return null;
            }
            for (i = 0; i < 2; i += 1) {
                ftr[i] = canonicalizeTime(ttrs[i]);
                if (ftr[i] === null) {
                    return null;
                }
            }

            return ftr;
        },

        currentMonth = function () {
            var cm = (new Date()).getMonth() + 1;
            return intToMonth(m, true);
        },

        currentYear = function () {
            return String((new Date()).getFullYear());
        },

        dateToDay = function (dateStr) {
            // date assumed to be in YYYY-MM-DD format, all numeric
            var y, m, d, dateObj, dow, day;
            [y, m, d] = dateStr.split('-');
            m -= 1;
            dateObj = new Date(y, m, d);
            dow = dateObj.getDay();
            return intToDay(dow);
        },

        daysInMonth = function (year, month) {
            if (! coreLib.isInteger(month)) {
                month = monthToInt(month);
            }
            return new Date(year, month, 0).getDate();
        },

        intToDay = function (d) {
            var day = null;
            // if 0 <= m <= 6, return three-letter string signifying the day
            // of the week; otherwise, return null
            console.log("Entering intToDay() with argument", d);
            d = parseInt(d, 10);
            if (d === 0) {
                day = "SUN";
            } else if (d === 1) {
                day = "MON";
            } else if (d === 2) {
                day = "TUE";
            } else if (d === 3) {
                day = "WED";
            } else if (d === 4) {
                day = "THU";
            } else if (d === 5) {
                day = "FRI";
            } else if (d === 6) {
                day = "SAT";
            }
            return day;
        },

        intToMonth = function (m, full) {
            var month = null;
            // if 1 <= m <= 12, return three-letter string signifying the month
            // otherwise, return null
            console.log("Entering intToMonth() with argument", m);
            m = parseInt(m, 10);
            if (m > 0 && m < 13) {
                if (full === true) {
                    month = mflt[m];
                } else {
                    month = mlt[m];
                }
            }
            return month;
        }, // intToMonth

        isTimeRangeAfterTime = function (tr, t) {
            var b, e, trh, trm, th, tm;
            [b, e] = tr.split('-');
            [trh, trm] = b.split(':');
            [th, tm] = t.split(':');
            trh = parseInt(trh, 10);
            trm = parseInt(trm, 10);
            th = parseInt(th, 10);
            tm = parseInt(tm, 10);
            if (trh > th) {
                return true;
            }
            if (trh < th) {
                return false;
            }
            // trh === th
            if (trm > tm) {
                return true;
            }
            return false;
        }, // isTimeRangeAfterTime

        isTimeWithinTimeRange = function (t, tr) {
            var b, e, t, trbh, treh, trbm, trem, th, tm;
            [b, e] = tr.split('-');
            [trbh, trbm] = b.split(':');
            [treh, trem] = e.split(':');
            [th, tm] = t.split(':');
            trbh = parseInt(trbh, 10);
            trbm = parseInt(trbm, 10);
            treh = parseInt(treh, 10);
            trem = parseInt(trem, 10);
            th = parseInt(th, 10);
            tm = parseInt(tm, 10);
            if (th === trbh && tm === trbm) {
                return true;
            }
            if (th === treh && tm === trem) {
                return false;
            }
            t = parseFloat(th + '.' + tm);
            b = parseFloat(trbh + '.' + trbm);
            e = parseFloat(treh + '.' + trem);
            if (t > b && t < e) {
                return true;
            }
            return false;
        }, // isTimeWithinTimeRange

        minutesToTime = function (m) {
            console.log("Entering minutesToTime() with argument", m);
            var quotient,
                remainder;
            if (m < 0) {
                return null;
            }
            if (m > 1440) {
                m = 1440;
            }
            quotient = String(Math.floor(m/60));
            remainder = String(m % 60);
            console.log("Quotient is", quotient);
            console.log("Remainder is", remainder);
            return canonicalizeTime(quotient + ":" + remainder);
        },

        monthToInt = function (month) {
            console.log("Entering monthToInt() with argument", month);
            var m = 0;
            month = String(month).trim().toUpperCase().slice(0, 3);
            if (month === "JAN") {
                m = 1;
            } else if (month === "FEB") {
                m = 2;
            } else if (month === "MAR") {
                m = 3;
            } else if (month === "APR") {
                m = 4;
            } else if (month === "MAY") {
                m = 5;
            } else if (month === "JUN") {
                m = 6;
            } else if (month === "JUL") {
                m = 7;
            } else if (month === "AUG") {
                m = 8;
            } else if (month === "SEP") {
                m = 9;
            } else if (month === "OCT") {
                m = 10;
            } else if (month === "NOV") {
                m = 11;
            } else if (month === "DEC") {
                m = 12;
            }
            return m;
        }, // monthToInt

        readableDate = function (urd) {
            // convert "YYYY-MM-DD HH:DD:SS+TZ" string into YYYY-MMM-DD
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
            month = intToMonth(m);
            return year.toString() + "-" + month + "-" + day.toString();
        }, // readableDate

        strToMonth = function (buf, full) {
            console.log("Entering strToMonth() with argument", buf);
            var m = String(buf).trim().toLowerCase().slice(0, 3);
            if (m.length < 1) {
                return null;
            }
            if (mlo.hasOwnProperty(m)) {
                if (full === true) {
                    return mlo[m];
                } else {
                    return mlo[m].toUpperCase().slice(0, 3);
                }
            }
            return null;
        }, // strToMonth

        timeToMinutes = function (ts) {
            // convert a canonicalized time string into minutes
            var buf = String(ts).split(':');
            if (buf.length !== 2) {
                return null;
            }
            buf[0] = parseInt(buf[0], 10);
            if (buf[0] > 24) {
                return null;
            }
            buf[1] = parseInt(buf[1], 10);
            if (buf[1] > 59) {
                return null;
            }
            return buf[0] * 60 + buf[1];
        },

        tsrangeToDateAndTimeRange = function (tsr) {
            // tsr looks like this: ["2017-10-20 08:00:00+02","2017-10-20 12:00:00+02")
            var date = tsr.match(/\d{4}-\d{2}-\d{2}/)[0];
            return [date, tsrangeToTimeRange(tsr)];
        },

        tsrangeToTimeRange = function (tsr) {
            // tsr looks like this: ["2017-10-20 08:00:00+02","2017-10-20 12:00:00+02")
            var begin, end, h, m, s, re = /\d{2}:\d{2}:\d{2}/;
            [begin, end] = tsr.split(',');
            begin = begin.match(re)[0];
            [h, m, s] = begin.split(':');
            begin = h + ':' + m;
            end = end.match(re)[0];
            [h, m, s] = end.split(':');
            end = h + ':' + m;
            return begin + '-' + end;
        },

        vetDate = function (d) {
            console.log("Entering vetDate() with argument", d);
            var i,
                td = String(d).trim(),
                tda;

            // handle offset date (e.g. "-1", "+2")
            if (td === "0" || td.match(/^[+-]\d+$/)) {
                return vetDateOffset(td);
            }

            tda = td.split(/-|\.|\/|\s+/);
            console.log("Identified " + tda.length + " date components", tda);

            if (tda.length === 1 && String(tda[0]).length === 0) {
                return vetDateNothing();
            } else if (tda.length === 1) {
                return vetDateDD(tda);
            } else if (tda.length === 2) {
                if (coreLib.isInteger(tda[0]) && ! coreLib.isInteger(tda[1])) {
                    return vetDateDDMM(tda);
                } else {
                    return vetDateMMDD(tda);
                }
            } else if (tda.length === 3) {
                return vetDateYYYYMMDD(tda);
            }
            return null;
        },

        vetDateDD = function (ds) {
            var d4 = String(ds).toLowerCase().slice(0, 4);
            if (d4 == "toda") {
                return vetDateOffset(0);
            }
            if (d4 == "yest") {
                return vetDateOffset(-1);
            }
            if (d4 == "tomo") {
                return vetDateOffset(+1);
            }
            return vetDateYYYYMMDD([
                today.getFullYear(), today.getMonth() + 1, ds[0]
            ]);
        }, // vetDateDD

        vetDateDDMM = function (ds) {
            return vetDateYYYYMMDD([
                today.getFullYear(), ds[1], ds[0]
            ]);
        }, // vetDateDDMM

        vetDateMMDD = function (ds) {
            console.log("Entering vetDateMMDD() with argument", ds);
            var ds0 = ds[0],
                ds1 = ds[1];
            if (coreLib.isInteger(ds[0]) && coreLib.isInteger(ds[1])) {
                ds0 = parseInt(ds0, 10);
                ds1 = parseInt(ds1, 10);
                if (ds0 > 12 && ds1 < 13) {
                    ds0 = ds[1];
                    ds1 = ds[0];
                }
            }
            return vetDateYYYYMMDD([
                today.getFullYear(), ds0, ds1
            ]);
        }, // vetDateMMDD

        vetDateOffset = function (dof) {
            console.log("Entering vetDateOffset() with argument", dof);
            var d = new Date();
            d.setDate(d.getDate() + parseInt(dof, 10));
            return vetDateYYYYMMDD([
                d.getFullYear(), d.getMonth() + 1, d.getDate()
            ]);
        }, //vetDateOffset

        vetDateNothing = function () {
            return vetDateYYYYMMDD([
                today.getFullYear(), today.getMonth() + 1, today.getDate()
            ]);
        }, // vetDateNothing

        vetDateRange = function (dr) {
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

        vetDateYYYYMMDD = function (ds) {
            console.log("Entering vetDateYYYYMMDD() with argument", ds);
            var y = parseInt(ds[0], 10),
                m = ds[1],
                d = parseInt(ds[2], 10),
                month;
            if (! coreLib.isInteger(y) || ! coreLib.isInteger(d)) {
                console.log("Non-integer year or day-of-month");
                return null;
            }
            if (y < 0 || d < 0) {
                console.log("Negative year or day-of-month");
                return null;
            }
            if (y > 0 && y < 32) {
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
                month = intToMonth(m);
            } else {
                month = strToMonth(String(m));
                if (month === null) {
                    return null;
                }
            }
            if (! coreLib.isInteger(d) || d < 1 || d > 31) {
                console.log("Day-of-month out of range");
                return null;
            }
            return String(y) + 
                   '-' +
                   month +
                   '-' +
                   String(d);
        }, // vetDateYYYYMMDD

        vetDayList = function (tokens) {
            // tokens is an array of integers supposed to be days of a month
            // each array member can be:
            // - a single day (e.g. "1", "30")
            // - a range (e.g. "6-12")
            var daylist = [],
                i, j, rangeBegin, rangeEnd, t;
            console.log("Entering vetDayList() with tokens", tokens);
            for (i = 0; i < tokens.length; i += 1) {
                tokens[i] = tokens[i].trim();
                t = tokens[i];
                // console.log("Iterating with token " + t);
                // t is either a number or a range: if it's a number, push it 
                // to daylist. If it's a range, push each range member.
                if (t.indexOf('-') === -1) {
                    if (! coreLib.isInteger(t) || t < 1 || t > 31) {
                        console.log("Ignoring non-numeric dayspec " + t);
                        continue;
                    }
                    daylist.push(t);
                } else {
                    [rangeBegin, rangeEnd] = t.split('-');
                    rangeBegin = parseInt(rangeBegin, 10);
                    rangeEnd = parseInt(rangeEnd, 10);
                    if (! coreLib.isInteger(rangeBegin) || ! coreLib.isInteger(rangeEnd) ||
                        rangeBegin < 1 || rangeBegin > 31 ||
                        rangeEnd < 1 || rangeEnd > 31 ||
                        rangeBegin > rangeEnd) {
                        console.log("Ignoring invalid day range ->" + t + "<-");
                        continue;
                    }
                    // console.log("Encountered range from " + rangeBegin + " to " + rangeEnd);
                    for (j = rangeBegin; j < (rangeEnd + 1); j += 1) {
                        // console.log("Looping j == " + j);
                        daylist.push(j);
                        if (j > 31) {
                            console.log("Illegal j", j);
                            break;
                        }
                    }
                    // console.log("Completed j-loop");
                }
                if (i > 100) {
                    console.log("Illegal i", i);
                    break;
                }
            }
            // console.log("Completed i-loop");
            return (coreLib.uniq(daylist)).sort(
                function(a, b) { return a - b; }
            );
        },

        vetMonth = function (m) {
            var cm = (new Date()).getMonth() + 1,
                itm = intToMonth(m, true),
                stm = strToMonth(m, true);
            if (m === undefined || m === null || String(m).length === 0) {
                return intToMonth(cm, true);
            }
            if (itm !== null) {
                return itm;
            }
            if (stm !== null) {
                return stm;
            }
            return null;
        },

        vetTimeRange = function (tr) {
            var ctr = canonicalizeTimeRange(tr, { "offset": true });
            if (ctr === null) {
                return null
            } else if (coreLib.isArray(ctr)) {
                return ctr[0] + '-' + ctr[1];
            }
            return ctr;
        },

        vetTimeRangeNoOffset = function (tr) {
            var ctr = canonicalizeTimeRange(tr, { "offset": false });
            if (ctr === null) {
                return null
            } else if (coreLib.isArray(ctr)) {
                return ctr[0] + '-' + ctr[1];
            }
            return ctr;
        },

        vetYear = function (y) {
            var iy = parseInt(y, 10);
            // console.log("Entering vetYear()", iy, typeof iy);
            if (Number.isNaN(iy)) {
                return currentYear();
            }
            if (iy < 0 || iy > 2100) {
                return null;
            }
            if (iy < 1900) {
                if (iy < 100) {
                    return String(2000 + iy);
                } else {
                    return null;
                }
            }
            return y;
        }
        ;

    return {
        addMinutes: addMinutes,
        canonicalizeTime: canonicalizeTime,
        canonicalizeTimeRange: canonicalizeTimeRange,
        canonicalizeTimeRangeOffset: canonicalizeTimeRangeOffset,
        currentMonth: currentMonth,
        currentYear: currentYear,
        dateToDay: dateToDay,
        daysInMonth: daysInMonth,
        intToDay: intToDay,
        intToMonth: intToMonth,
        isTimeRangeAfterTime: isTimeRangeAfterTime,
        isTimeWithinTimeRange: isTimeWithinTimeRange,
        minutesToTime: minutesToTime,
        monthToInt: monthToInt,
        readableDate: readableDate,
        strToMonth: strToMonth,
        timeToMinutes: timeToMinutes,
        tsrangeToDateAndTimeRange: tsrangeToDateAndTimeRange,
        tsrangeToTimeRange: tsrangeToTimeRange,
        vetDate: vetDate,
        vetDateDD: vetDateDD,
        vetDateMMDD: vetDateMMDD,
        vetDateOffset: vetDateOffset,
        vetDateRange: vetDateRange,
        vetDateYYYYMMDD: vetDateYYYYMMDD,
        vetDayList: vetDayList,
        vetMonth: vetMonth,
        vetTimeRange: vetTimeRange,
        vetTimeRangeNoOffset: vetTimeRangeNoOffset,
        vetYear: vetYear,
    };

});

