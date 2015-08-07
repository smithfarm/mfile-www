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
// html.js - functions that generate HTML source code
//
"use strict";

define ([
    'cf',
    'current-user',
    'lib',
    'app/lib',
    'target'
], function (
    cf,
    currentUser,
    lib,
    appLib,
    target
) {
    var 
        //
        // "Your choice" section at the bottom - shared by all target types
        //
        yourChoice = function () {
            return '<br><b>Your choice:</b> <input name="sel" size=3 maxlength=2> ' +
                   '<input id="submitButton" type="submit" value="Submit"><br><br>'
        },
        //
        // miniMenu is shared by dform and dbrowser
        //
        miniMenu = function (mm) {
            // mm is the dbrowser miniMenu object
            var len = mm.entries.length,
                entry,
                i,
                r;
            console.log("miniMenu is ", mm);
            console.log("miniMenu length is " + len);
            if (len > 0) {
                r = 'Menu:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                for (i = 0; i < len; i += 1) {
                    //console.log("i === " + i);
                    console.log("Attempting to pull target " + mm.entries[i] + " from miniMenu");
                    entry = target.pull(mm.entries[i]);
                    if (lib.privCheck(entry.aclProfile)) {
                        r += i + '. ' + entry.menuText + '&nbsp;&nbsp;';
                    }
                }
                r += 'X. ' + mm.back[0];
            } else {
                r = mm.back[0];
            }
            return r;
        },        
        browserNavMenu = function (len, pos) {
            var r = '',
                context = {
                    forward: 0,
                    back: 0,
                    jumpToEnd: 0,
                    jumpToBegin: 0
                };
	    // context-sensitive navigation menu: selections are based on
	    // set length and cursor position:
            //   if set.length <= 1: no navigation menu at all
            //   if 1 < set.length <= 5: forward, back
            //   if set.length > 5: forward, back, jump to end/beginning
            //   if pos == 1 then back and jump to beginning are deactivated
            //   if pos == set.length then forward and jump to end are deactivated
            // here in html.js, we add <span> elements for each context-sensitive
            // selection. Each such element has a unique identifier, so that in 
            // start.js we can check for the presence of each and handle accordingly
            if (len > 1) {
                //
                // there is at least one record to display:
                // (a) determine context
                //
                if (len > 1) {
                    context.forward = 1;
                    context.back = 1;
                }
                if (len > 5) {
                    context.jumpToEnd = 1;
                    context.jumpToBegin = 1;
                }
                if (pos === 0) {
                    context.back = 0;
                    context.jumpToBegin = 0;
                }
                if (pos === len - 1) {
                    context.forward = 0;
                    context.jumpToEnd = 0;
                }
                //
                // (b) construct navigation menu
                //
                r += 'Navigation:&nbsp;&nbsp;';
                if (context.back) {
                    r += '<span id="navBack">[\u2190] Previous </span>';
                }
                if (context.forward) {
                    r += '<span id="navForward">[\u2192] Next </span>';
                }
                if (context.jumpToBegin) {
                    r += '<span id="navJumpToBegin">[\u2303\u2190] Jump to first </span>';
                }
                if (context.jumpToEnd) {
                    r += '<span id="navJumpToEnd">[\u2303\u2192] Jump to last </span>';
                }
                r += '<br>';
            } else {
                r = '';
            }
            return r;
        };

    return {
        demoActionFromMenu: function () {
            return '<br><br>SAMPLE ACTION - SOMETHING IS HAPPENING<br><br><br>';
        },
        demoActionFromSubmenu: function () {
            return '<br><br>SAMPLE ACTION - foo bar actioning bazness<br><br><br>';
        },
        loginDialog: function () {
            var r = '';
            r += '<form id="loginform">';
            r += '<br><br><br>';
            r += cf('loginDialogChallengeText');
            r += '<br><br>';
            r += 'Username: <input name="nam" size="' + cf('loginDialogMaxLengthUsername') + '"';
            r += 'maxlength="' + cf('loginDialogMaxLengthUsername') + '" /><br>';
            r += 'Password: <input name="pwd" type="password" size="' + cf('loginDialogMaxLengthPassword') + '"';
            r += 'maxlength="' + cf('loginDialogMaxLengthPassword') + '" /><br><br>';
            r += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
            r += '<input type="submit" value="Submit"><br><br>';
            r += '</form>';
            return r;
        },
        logout: function () {
            var r = '';
            r += '<br><br><br>';
            r += 'You have been logged out of our humble application<br><br>';
            r += 'Have a lot of fun!<br><br><br>';
            return r;
        },
        body: function () {
            var r = '';
            r += '<div class="leftright">';

            r += '<p class="alignleft" style="font-size: x-large; font-weight: bold">';
            r += cf('appName');
            r += ' <span style="font-size: normal; font-weight: normal;">';
            r += cf('appVersion') + '</span>';
            r += '</p>';

            r += '<p class="alignright"><span id="userbox">';
            r += appLib.fillUserBox();
            r += '</span></p>';

            r += '</div>';

            r += '<div class="boxtopbot" id="header" style="clear: both;">';
            r += '   <span class="subbox" id="topmesg">If application appears';
            r += '   unresponsive, make sure browser window is active and press \'TAB\'</span>';
            r += '</div>';

            r += '<div class="mainarea" id="mainarea"></div>';

            r += '<div class="boxtopbot" id="result">&nbsp;</div>';

            r += '<div id="noticesline" style="font-size: small">';
            r += appLib.fillNoticesLine();
            r += '</div>';
            return r;
        },
        //
        // dmenu target
        //
        dmenu: function (dmn) {
            console.log("Entering html.dmenu with argument " + dmn);
            // dmn is dmenu name
            // dmo is dmenu object
            var dmo = target.pull(dmn),
                r = '',
                len = dmo.entries.length,
                i,
                back = target.pull(dmo.back),
                entry;
        
            r += '<form id="' + dmn + '"><br><b>' + dmo.title + '</b><br><br>';

            for (i = 0; i < len; i += 1) {
                // the entries are names of targets
                console.log("Attempting to pull target " + dmo.entries[i]);
                entry = target.pull(dmo.entries[i]);
                if (lib.privCheck(entry.aclProfile)) {
                    r += i + '. ' + entry.menuText + '<br>';
                }
            }
            r += 'X. ' + back.menuText + '<br>';

            r += yourChoice();

            r += '</form>';
            return r;
        },
        //
        // dform target
        //
        dform: function (dfn) {
            // dfn is dform name
            // dfo is dform object
            var dfo = target.pull(dfn);
            return function (obj) {
        
                console.log("Generating source code of dform " + dfn);
                var r = '<form id="' + dfo.name + '">',
                    len,
                    i,
                    entry;
        
                r += '<br><b>' + dfo.title + '</b><br><br>';
        
                if (dfo.preamble) {
                    r += dfo.preamble + '<br><br>';
                }
        
                // READ-ONLY entries first
                len = dfo.entriesRead ? dfo.entriesRead.length : 0;
                if (len > 0) {
                    for (i = 0; i < len; i += 1) {
                        entry = dfo.entriesRead[i];
                        if (lib.privCheck(entry.aclProfileRead)) {
                            r += lib.rightPadSpaces(entry.text.concat(':'), 13);
                            r += '<span id="' + entry.name + '">' + (obj[entry.prop] || '') + '</span><br>';
                        }
                    }
                    r += '<br>';
                }
        
                // READ-WRITE entries second
                len = dfo.entriesWrite ? dfo.entriesWrite.length : 0;
                if (len > 0) {
                    for (i = 0; i < len; i += 1) {
                        entry = dfo.entriesWrite[i];
                        if (lib.privCheck(entry.aclProfileWrite)) {
                            r += lib.rightPadSpaces(entry.text.concat(':'), 13);
                            r += '<input id="' + entry.name + '" ';
                            r += 'name="entry' + i + '" ';
                            r += 'value="' + (obj[entry.prop] || '') + '" ';
                            r += 'size="' + entry.maxlen + '" ';
                            r += 'maxlength="' + entry.maxlen + '"><br>';
                        }
                    }
                    r += '<br>';
                }
        
                // miniMenu at the bottom
                r += miniMenu(dfo.miniMenu);

                // your choice section
                r += yourChoice();

                r += '</form>';
                //console.log("Assembled source code for " + dfn + " - it has " + r.length + " characters");
                return r;
            };
        },
        dbrowser: function (dbn) {
            // dfn is dform name
            // dfo is dform object
            var dbo = target.pull(dbn);
            return function (set, pos) {
        
                //console.log("Generating source code of dbrowser " + dbn);
                var r = '<form id="' + dbo.name + '">',
                    len,
                    i,
                    obj,
                    entry;
        
                r += '<br><b>' + dbo.title + '</b><br><br>';
        
                if (dbo.preamble) {
                    r += dbo.preamble + '<br><br>';
                }
        
                // display entries
                len = dbo.entries ? dbo.entries.length : 0;
                obj = set[pos];
                if (len > 0) {
                    for (i = 0; i < len; i += 1) {
                        entry = dbo.entries[i];
                        if (lib.privCheck(entry.aclProfile)) {
                            r += lib.rightPadSpaces(entry.text.concat(':'), 13);
                            r += '<span id="' + entry.name + '">' + (obj[entry.prop] || '') + '</span><br>';
                        }
                    }
                    r += '<br>';
                }

		// context-sensitive navigation menu: selections are based on
		// set length and cursor position
                r += browserNavMenu(set.length, pos);
                
		// miniMenu at the bottom: selections are target names defined
		// in the 'miniMenu' property of the dform object
                r += miniMenu(dbo.miniMenu);

                // your choice section
                r += yourChoice();

                r += '</form>';
                console.log("Assembled source code for " + dbn + " - it has " + r.length + " characters");
                return r;
            };
        },
        //
        // dnotice target
        //
        dnotice: function (dnn) {
            console.log("Entering html.dnotice with argument " + dnn);
            // dnn is dnotice name
            // dno is dnotice object
            var dno = target.pull(dnn);
            return function () {
                var r = '';
                r += '<div id="' + dnn + '"><br><b>' + dno.title + '</b><br><br>';
                r += dno.preamble + '<br>';
                r += '<div id="noticeText"></div><br>';
                r += "To leave this page, press ENTER or click the Submit button";
                r += yourChoice();
                r += '</div>';
                return r;
            };
        }
    };
});
