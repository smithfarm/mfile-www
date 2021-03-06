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
// tests/prototypes.js
//
"use strict";

define ([
    'QUnit',
    'prototypes'
], function (
    QUnit,
    prototypes 
) {
    return function () {

        QUnit.test('prototypes prototyping', function (assert) {

            var t = Object.create(prototypes.target),
                u = Object.create(prototypes.user);

            // target
            assert.strictEqual(typeof t, 'object', 't is an object');
            assert.strictEqual(typeof t.name, 'string', 'target.name OK');
            assert.strictEqual(t.name, 'protoTarget', 't.name OK');
            assert.strictEqual(typeof t.menuText, 'string', 'target.menuText OK');
            assert.strictEqual(t.menuText, '(none)', 't.menuText OK');
            assert.strictEqual(typeof t.source, 'string', 'target.source OK');
            assert.strictEqual(t.source, '(none)', 't.source OK');
            assert.strictEqual(typeof t.pushable, 'boolean', 'target.pushable OK');
            assert.strictEqual(t.pushable, true, 't.pushable OK');
            assert.deepEqual(t.getEntries(), [], 't.getEntries() empty OK');
            t.entriesRead = ['foo', 'bar'];
            t.entriesWrite = ['baz', 'blat'];
            assert.deepEqual(t.getEntries(), ['foo', 'bar', 'baz', 'blat'], 't.getEntries() full OK');
            t.entriesWrite = [];
            assert.strictEqual(t.getVetter('foo'), null, 'no vetter in target with empty entriesWrite array');
            t.entriesWrite = [{"name": "foo"}];
            assert.strictEqual(t.getVetter('foo'), null, 'still no vetter in target');
            t.entriesWrite = [{"name": "foo", "vetter": "bar"}];
            assert.strictEqual(t.getVetter('foo'), null, 'still no vetter in target');
            t.entriesWrite = [{"name": "foo", "vetter": function () {}}];
            assert.strictEqual(typeof t.getVetter('foo'), 'function', 'vetter exists in target');

            // user
            assert.strictEqual(typeof u, 'object', 'u is an object');
            assert.strictEqual(typeof u.nick, 'string', 'user.nick OK');
            assert.strictEqual(u.nick, '', 'user.nick OK');
            assert.notOk(u.hasOwnProperty('passhash'), 'user prototype has no passhash property');
            assert.notOk(u.hasOwnProperty('salt'), 'user prototype has no salt property');

        });

    };
});

