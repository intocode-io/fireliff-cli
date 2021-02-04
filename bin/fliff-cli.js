#!/usr/bin/env node
"use strict";

require("console.table");

var path = _interopRequireWildcard(require("path"));

var _package = _interopRequireDefault(require("../package.json"));

require("./colors-set-theme");

var _fliff = require("./fliff.js");

var _shared = require("./shared");

var _fliffCliUsage = _interopRequireWildcard(require("./fliff-cli-usage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

try {
  const commandLineArgs = require('command-line-args');

  const commandLineUsage = require('command-line-usage');

  const {
    operation,
    _unknown
  } = commandLineArgs([{
    name: 'operation',
    defaultOption: true
  }], {
    stopAtFirstUnknown: true
  });
  const argv = _unknown || [];
  const options = commandLineArgs([{
    name: 'ble',
    type: String
  }, {
    name: 'description',
    type: String
  }, {
    name: 'id',
    type: String
  }, {
    name: 'issue',
    type: Boolean
  }, {
    name: 'name',
    type: String
  }, {
    name: 'revoke',
    type: String
  }, {
    name: 'save',
    type: Boolean
  }, {
    name: 'secret',
    type: String
  }, {
    name: 'type',
    type: String
  }, {
    name: 'url',
    type: String
  }, {
    name: 'version',
    alias: 'v',
    type: Boolean
  }, {
    name: 'detail',
    type: Boolean
  }, {
    name: 'help',
    alias: 'h',
    type: Boolean
  }], {
    argv
  });
  const fliff = new _fliff.FLIFF();

  if (options.help) {
    switch (operation) {
      case 'add':
        console.log(commandLineUsage(_fliffCliUsage.addUsage));
        break;

      case 'update':
        console.log(commandLineUsage(_fliffCliUsage.updateUsage));
        break;

      case 'delete':
        console.log(commandLineUsage(_fliffCliUsage.deleteUsage));
        break;

      case 'get':
        console.log(commandLineUsage(_fliffCliUsage.getUsage));
        break;

      case 'token':
        console.log(commandLineUsage(_fliffCliUsage.tokenUsage));
        break;

      case 'init':
        console.log(commandLineUsage(_fliffCliUsage.initUsage));
        break;

      case 'config':
        console.log(commandLineUsage(_fliffCliUsage.configUsage));
        break;

      default:
        console.log(commandLineUsage(_fliffCliUsage.default));
    }

    process.exit(0);
  } // Commands that need Functions config


  if (['add', 'update', 'delete', 'get', 'token'].indexOf(operation) > -1) {
    (0, _shared.getConfig)().then(config => {
      switch (operation) {
        case 'add':
          (0, _shared.validateConfig)(config);
          console.log('Sending request to add LIFF view...'.verbose);
          fliff.add(options).then(rsAdd => {
            console.log(`Created ${options.name.input} view with LIFF ID: ${rsAdd.info}`.verbose);
            return rsAdd;
          }).catch(errAdd => {
            const message = errAdd.message || errAdd;
            console.log(message.error);
            process.exit(1);
          });
          break;

        case 'delete':
          (0, _shared.validateConfig)(config);
          console.log(`Sending request to delete LIFF view(s)...`.verbose);
          fliff.delete(options).then(rsDelete => {
            console.log(`Deleted view with LIFF ID: ${options.id.input}`.verbose);
            console.log(`Unset view(s) in Functions configuration`.info, rsDelete);
            return rsDelete;
          }).catch(errDelete => {
            const message = errDelete.message || errDelete;
            console.log(message.error);
            process.exit(1);
          });
          break;

        case 'get':
          (0, _shared.validateConfig)(config);
          console.log('Sending request to get LIFF view(s)...'.verbose);
          fliff.get(options).then(rsGet => {
            if (Array.isArray(rsGet)) {
              console.table(rsGet);
            } else {
              console.log(rsGet);
            }

            return rsGet;
          }).catch(errGet => {
            const message = errGet.message || errGet;
            console.log(message.error);
            process.exit(1);
          });
          break;

        case 'update':
          (0, _shared.validateConfig)(config);
          console.log(`Sending request to update LIFF view`.verbose);
          fliff.update(options).then(rsUpdate => {
            console.log(`Updated LIFF ID: ${options.id.input}`.info);
            return rsUpdate;
          }).catch(errUpdate => {
            const message = errUpdate.message || errUpdate;
            console.log(message.error);
            process.exit(1);
          });
          break;

        case 'token':
          if (options.issue === true) {
            console.log('Issuing channel access token'.verbose);
          } else if (options.revoke !== undefined) {
            console.log('Revoking channel access token'.verbose);
          }

          fliff.token(options).then(rsToken => {
            if (options.issue === true && rsToken.accessToken) {
              console.log(`The following token has been issued.`.info);
              console.log(JSON.stringify(rsToken, undefined, 2));

              if (options.save === true) {
                console.log(`The access token is saved on Firebase Functions Configuration.`.info);
              } else {
                console.log(`This access token is NOT saved on Firebase Functions Configuration.`.warn);
                console.log(`If you would like to saved on Firebase Functions Configuration. Try re-run using ${'fliff token --issue --save'.input} `.help);
              }
            } else if (options.revoke !== undefined && rsToken === true) {
              console.log(`The token is revoked.`.info);
            } else {
              console.log('Unknown response').warn;
            }

            return rsToken;
          }).catch(errToken => {
            const message = errToken.message || errToken;
            console.log(message.error);
            process.exit(1);
          });
          break;

        default:
      }
    });
  } else if (operation) {
    const initPath = path.resolve(process.cwd(), 'web-views');

    switch (operation) {
      case 'init':
        fliff.init(initPath).then(rsInit => {
          console.log('Generated files'.info);
          rsInit.files.forEach(dest => console.log(dest.info));

          if (rsInit.message) {
            console.log(rsInit.message);
          }

          return true;
        }).then(() => fliff.installNow(initPath)).catch(errInit => {
          const message = errInit.message || errInit;
          console.log(message.error);
          process.exit(1);
        });
        break;

      case 'version':
        console.log(`Version: ${_package.default.version}`);
        break;

      case 'config':
        console.log(`Configuring Firebase Functions`.verbose);
        fliff.config(options).then(rsConfig => {
          console.log(`The following property has been updated.`.info);
          console.log(JSON.stringify(rsConfig, undefined, 2));
          console.log(`Firebase Functions configured`.info);
          return rsConfig;
        }).catch(errConfig => {
          const message = errConfig.message || errConfig;
          console.log(message.error);
          process.exit(1);
        });
        break;

      case 'help':
      default:
        console.log(commandLineUsage(_fliffCliUsage.default));
    }
  } else if (options.version) {
    console.log(`Version: ${_package.default.version}`);
  } else {
    console.log(commandLineUsage(_fliffCliUsage.default));
  }
} catch (commandError) {
  (0, _shared.commandErrorHandler)(commandError);
}
//# sourceMappingURL=fliff-cli.js.map