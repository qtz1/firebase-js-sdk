"use strict";
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
exports.__esModule = true;
var path_1 = require("path");
var child_process_promise_1 = require("child-process-promise");
var yargs = require("yargs");
var argv = yargs.options({
    main: {
        type: 'string',
        demandOption: true
    },
    platform: {
        type: 'string',
        "default": 'node'
    },
    emulator: {
        type: 'boolean'
    },
    persistence: {
        type: 'boolean'
    }
}).parseSync();
var nyc = (0, path_1.resolve)(__dirname, '../../../node_modules/.bin/nyc');
var mocha = (0, path_1.resolve)(__dirname, '../../../node_modules/.bin/mocha');
var babel = (0, path_1.resolve)(__dirname, '../babel-register.js');
// used in '../../config/mocharc.node.js' to disable ts-node
process.env.NO_TS_NODE = "true";
process.env.TEST_PLATFORM = argv.platform;
var args = [
    '--reporter',
    'lcovonly',
    mocha,
    '--require',
    babel,
    '--require',
    argv.main,
    '--config',
    '../../config/mocharc.node.js'
];
if (argv.emulator) {
    process.env.FIRESTORE_EMULATOR_PORT = '8080';
    process.env.FIRESTORE_EMULATOR_PROJECT_ID = 'test-emulator';
}
if (argv.persistence) {
    process.env.USE_MOCK_PERSISTENCE = 'YES';
    args.push('--require', 'test/util/node_persistence.ts');
}
if (argv.pg) {
    console.log("Running with PG persistence.");
    process.env.USE_PG_PERSISTENCE = 'YES';
    args.push('--require', 'test/util/node_pg_persistence.ts');
}
args = args.concat(argv._);
var childProcess = (0, child_process_promise_1.spawn)(nyc, args, {
    stdio: 'inherit',
    cwd: process.cwd()
}).childProcess;
process.once('exit', function () { return childProcess.kill(); });
process.once('SIGINT', function () { return childProcess.kill('SIGINT'); });
process.once('SIGTERM', function () { return childProcess.kill('SIGTERM'); });
