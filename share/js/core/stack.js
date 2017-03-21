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
// stack.js -- stack enabling targets (dialogs) to be "push"ed and "pop"ped
//
// Before calling the start() method on a target, call stack.push(target)
//
// To return to the previous dialog, just call stack.pop()
//
// Each target type (dmenu, dform, etc.) needs to have methods for saving
// and restoring the target state. These can range from very simple (dmenu)
// to complicated (dbrowser).
//
"use strict";

define ([
    "jquery",
    "lib",
    "prototypes",
    "target"
], function (
    $,
    lib,
    prototypes,
    target
) {

    var
        // object for storing the stack
        _stack = [],

        // pop a target and its state off the stack
        // takes an optional argument - object to be merged into stateObj
        pop = function (mo, start) {
            start = (start === false) ? false : true;
            console.log("Entering stack.pop() with stack", _stack);
            var stackObj,
                type;
            _stack.pop(); 
            if (_stack.length === 0) {
                console.log("Stack empty - logging out");
                target.pull('logout').start();
                return;
            }
            stackObj = _stack[_stack.length - 1];
            if (typeof mo === 'object') {
                console.log("pop() was passed an object", mo);
                $.extend(stackObj.state, mo);
            }
            console.log("Popped " + stackObj.target.name);
            type = stackObj.target.type;
            if (start) {
                lib.clearResult();
                stackObj.target.start();
            }
        },

        // push a target and its state onto the stack
        push = function (tgt, obj, opts) {
            console.log("Entering stack.push() with target", tgt, "object", obj, "and opts", opts);
            // console.log("and stack", _stack);
            var targetName,
                flag,
                xtarget;
            if (typeof tgt === "string") {
                targetName = tgt;
                tgt = target.pull(tgt);
            }
            if (typeof tgt !== "object") {
                console.log("ERROR in stack.push() - found no target object");
                return;
            }
            if (typeof opts === "object") {
                flag = opts.hasOwnProperty('flag') ? opts.flag : false;
                xtarget = opts.hasOwnProperty('xtarget') ? opts.xtarget : null;
                console.log("In stack.push(), setting flag", flag, "and xtarget", xtarget);
            }
            if (tgt.pushable) {
                _stack.push({
                    "target": tgt,
                    "state": obj,
                    "flag": flag,
                    "xtarget": xtarget
                });
            }
            lib.clearResult();
            tgt.start(obj);
        },

        getState = function () {
            return _stack[_stack.length - 1].state;
        },
        getTarget = function () {
            return _stack[_stack.length - 1].target;
        },
        getFlag = function () {
            return _stack[_stack.length - 1].flag;
        },
        getXTarget = function () {
            return _stack[_stack.length - 1].xtarget;
        },


        setState = function (newState) {
            _stack[_stack.length - 1].state = newState;
        },
        setTarget = function (newTarget) {
            _stack[_stack.length - 1].target = newTarget;
        },
        setFlag = function (newFlag) {
            _stack[_stack.length - 1].flag = newFlag;
        },
        setXTarget = function (newXTarget) {
            _stack[_stack.length - 1].xtarget = newXTarget;
        },

        // unwind stack until given target is reached
        unwindToTarget = function (tname) {
            console.log("Unwinding the stack to target " + tname);
            var tgt;
            for (var i = _stack.length; i > 0; i--) {
                tgt = _stack[i - 1].target;
                if (tgt.name === tname) {
                   break;
                }
                pop(null, false);
            }
            tgt.start();
        },
        
        unwindToFlag = function () {
            console.log("Unwinding the stack to flag");
            var flag;
            for (var i = _stack.length; i > 0; i--) {
                flag = _stack[i - 1].flag;
                if (flag) {
                   break;
                }
                pop(null, false);
            }
            _stack[_stack.length - 1].target.start();
        };

    return {
        "getState": getState,
        "getTarget": getTarget,
        "getFlag": getFlag,
        "getXTarget": getXTarget,
        "pop": pop,
        "push": push,
        "setState": setState,
        "setTarget": setTarget,
        "setFlag": setFlag,
        "setXTarget": setXTarget,
        "unwindToFlag": unwindToFlag,
        "unwindToTarget": unwindToTarget
    };

});
