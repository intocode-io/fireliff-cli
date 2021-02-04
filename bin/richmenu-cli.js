#!/usr/bin/env node
"use strict";

require("console.table");

var fs = _interopRequireWildcard(require("fs"));

var path = _interopRequireWildcard(require("path"));

var util = _interopRequireWildcard(require("util"));

require("./colors-set-theme");

var _package = _interopRequireDefault(require("../package.json"));

var _index = require("./index");

var _shared = require("./shared");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

try {
  const commandLineArgs = require('command-line-args');

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
    name: 'id',
    type: String
  }, {
    name: 'data',
    type: String
  }, {
    name: 'image',
    type: String
  }, {
    name: 'name',
    type: String
  }, {
    name: 'type',
    type: String
  }, {
    name: 'url',
    type: String
  }, {
    name: 'user',
    alias: 'U',
    type: String
  }, {
    name: 'version',
    alias: 'v',
    type: Boolean
  }, {
    name: 'detail',
    type: Boolean
  }], {
    argv
  }); // Commands that need Functions config

  if (['add', 'delete', 'get', 'default', 'link', 'unlink'].indexOf(operation) > -1) {
    (0, _shared.getConfig)().then(async config => {
      let accessToken = config.line.access_token;
      let names;
      let data;
      let dataSrc;
      let imageSrc;
      let req;
      let res;
      let uploadReq;
      (0, _shared.validateConfig)(config);

      switch (operation) {
        case 'add':
          req = new _index.RichMenuAddRequest({
            accessToken
          });
          dataSrc = path.resolve(process.cwd(), options.data || '');
          imageSrc = path.resolve(process.cwd(), options.image || '');

          if (options.data && options.image && fs.existsSync(dataSrc) && fs.existsSync(imageSrc)) {
            data = require(dataSrc);
          } else {
            console.log('Data file and image file must exist'.error);
            process.exit(1);
          }

          try {
            console.log('Sending request to add RichMenu...'.verbose);
            res = await req.send(data);
          } catch (error) {
            console.log(`Failed to add RichMenu`.error);
            console.error(error);
            process.exit(1);
          }

          try {
            console.log(`Created ${options.name.input} with RichMenu ID: ${res.data.richMenuId.info}`.verbose);
            await _index.LIFFConfig.setRichMenu(options.name, res.data.richMenuId);
          } catch (error) {
            console.log(`Failed to set Functions configuration`.error);
            console.log(`Try re-run with the following command`.help);
            console.log(`firebase functions:config:set richmenus.${options.name}=${res.data.richMenuId}`.code);
            console.error(error);
            process.exit(1);
          }

          try {
            console.log(`Uploading image for RichMenu ${res.data.richMenuId.info}`.verbose);
            uploadReq = new _index.RichMenuUploadRequest({
              accessToken
            });
            await uploadReq.send(res.data.richMenuId, imageSrc);
            console.log(`Uploaded`);
          } catch (error) {
            console.log(`Failed to upload image`.error);
            console.error(error);
            process.exit(1);
          }

          break;

        case 'delete':
          req = new _index.RichMenuDeleteRequest({
            accessToken
          });

          if (!options.id && !options.name) {
            console.warn(`Command ${'richmenu delete'.prompt} required RichMenu ID or name option`.warn);
            console.log(`Try re-run ${'richmenu delete --id <richMenuId>'.input} OR  ${'richmenu delete --name <richMenuName>'.input}`.help);
            process.exit(1);
          }

          if (options.name) {
            options.id = await _index.LIFFConfig.getRichMenuIdByName(options.name, config);

            if (typeof options.id !== 'string') {
              console.error(`Failed to retrieve RichMenu ID using RichMenu name ${options.name.input}`.error);
              process.exit(1);
            }
          }

          try {
            console.log(`Sending request to delete RichMenu ${options.id.input}`.verbose);
            res = await req.send(options.id);
            console.log(`Deleted RichMenu ID: ${options.id.input}`.verbose);
          } catch (error) {
            if (error.response && error.response.data) {
              if (error.response.data.message) {
                console.log(error.response.data.message.info);
              } else {
                console.log(`Failed to delete RichMenu ${options.id.input}`.error);
                console.error(error.response.data.error);
                process.exit(1);
              }
            } else {
              console.log(`Failed to delete RichMenu ${options.id.input}`.error);
              console.error(error);
              process.exit(1);
            }
          }

          try {
            names = await _index.LIFFConfig.getRichMenuNamesById(options.id, config);
            await Promise.all(names.map(name => _index.LIFFConfig.unsetRichMenu(name)));
            console.log(`Unset richmenu(s) in Functions configuration`.info, names);
          } catch (error) {
            console.log(`Failed to unset richmenu(s) in Functions configuration`.error);
            console.log(`Try looking for RichMenu name with RichMenu ID ${options.id.input} using ${'richmenu get'.prompt} command and unset it manually`.help);
            console.log(`firebase functions:config:unset richmenus.<richMenuName>`.code);
            console.error(error);
            process.exit(1);
          }

          break;

        case 'get':
          try {
            console.log('Sending request to get RichMenu(s)...'.verbose);
            req = new _index.RichMenuGetRequest({
              accessToken
            });
            res = await req.send();

            if (!res.data.richmenus || res.data.richmenus.length === 0) {
              console.log('RichMenu not found');
              process.exit(0);
            }
          } catch (error) {
            if (error.response && error.response.data) {
              if (error.response.data.message) {
                console.log(error.response.data.message.info);
                process.exit(0);
              } else {
                console.error(error.response.data.error);
                process.exit(1);
              }
            } else {
              console.error(error);
              process.exit(1);
            }
          }

          if (options.detail === true) {
            console.log(util.inspect(res.data.richmenus, false, null, true));
          } else {
            console.table(res.data.richmenus.map(menu => {
              const richmenus = Object.keys(config.richmenus).filter(key => {
                return config.richmenus[key] === menu.richMenuId;
              });
              return {
                RichMenu: richmenus.join(', '),
                'RichMenu ID': menu.richMenuId,
                Size: `${menu.size.width}x${menu.size.height}`,
                'Bar Text': menu.chatBarText,
                Selected: menu.selected,
                'No. of Areas': menu.areas.length
              };
            }));
          }

          break;

        case 'default':
          // Set menu as default for all users
          req = new _index.RichMenuSetDefaultRequest({
            accessToken
          });

          if (!options.id && !options.name) {
            console.warn(`Command ${'richmenu default'.prompt} required RichMenu ID or name option`.warn);
            console.log(`Try re-run ${'richmenu default --id <richMenuId>'.input} OR  ${'richmenu default --name <richMenuName>'.input}`.help);
            process.exit(1);
          }

          if (options.name) {
            options.id = await _index.LIFFConfig.getRichMenuIdByName(options.name, config);

            if (typeof options.id !== 'string') {
              console.error(`Failed to retrieve RichMenu ID using RichMenu name ${options.name.input}`.error);
              process.exit(1);
            }
          }

          try {
            console.log(`Sending request to set RichMenu ${options.id.input} as default`.verbose);
            res = await req.send(options.id);
            console.log(`Set default RichMenu ID: ${options.id.input}`.verbose);
          } catch (error) {
            if (error.response && error.response.data) {
              if (error.response.data.message) {
                console.log(error.response.data.message.info);
              } else {
                console.log(`Failed to set RichMenu ${options.id.input} as default`.error);
                console.error(error.response.data.error);
                process.exit(1);
              }
            } else {
              console.log(`Failed to set RichMenu ${options.id.input} as default`.error);
              console.error(error);
              process.exit(1);
            }
          }

          break;

        case 'link':
          // Link a rich menu to an individual user
          req = new _index.RichMenuLinkUserRequest({
            accessToken
          });

          if (!options.id && !options.name || !options.user) {
            console.warn(`Command ${'richmenu link'.prompt} required RichMenu ID or name option, and user option`.warn);
            console.log(`Try re-run ${'richmenu link --id <richMenuId> --user <userId>'.input} OR  ${'richmenu link --name <richMenuName> --user <userId>'.input}`.help);
            process.exit(1);
          }

          if (options.name) {
            options.id = await _index.LIFFConfig.getRichMenuIdByName(options.name, config);

            if (typeof options.id !== 'string') {
              console.error(`Failed to retrieve RichMenu ID using RichMenu name ${options.name.input}`.error);
              process.exit(1);
            }
          }

          try {
            console.log(`Sending request to link RichMenu ${options.id.input} to User ${options.user}`.verbose);
            res = await req.send(options.id, options.user);
            console.log(`Linked RichMenu ID ${options.id.input} to User ${options.user.input}`.verbose);
          } catch (error) {
            if (error.response && error.response.data) {
              if (error.response.data.message) {
                console.log(error.response.data.message.info);
              } else {
                console.log(`Failed to link RichMenu ${options.id.input} to User ${options.user.input}`.error);
                console.error(error.response.data.error);
                process.exit(1);
              }
            } else {
              console.log(`Failed to link RichMenu ${options.id.input} to User ${options.user.input}`.error);
              console.error(error);
              process.exit(1);
            }
          }

          break;

        case 'unlink':
          req = new _index.RichMenuUnlinkUserRequest({
            accessToken
          });

          if (!options.user) {
            console.warn(`Command ${'richmenu unlink'.prompt} required user option`.warn);
            console.log(`Try re-run ${'richmenu unlink --user <userId>'.input}`.help);
            process.exit(1);
          }

          try {
            console.log(`Sending request to unlink RichMenu from User ${options.user}`.verbose);
            res = await req.send(options.user);
            console.log(`Unlinked RichMenu from User ${options.user.input}`.verbose);
          } catch (error) {
            if (error.response && error.response.data) {
              if (error.response.data.message) {
                console.log(error.response.data.message.info);
              } else {
                console.log(`Failed to unlink RichMenu from User ${options.user.input}`.error);
                console.error(error.response.data.error);
                process.exit(1);
              }
            } else {
              console.log(`Failed to unlink RichMenu from User ${options.user.input}`.error);
              console.error(error);
              process.exit(1);
            }
          }

          break;

        default:
      }
    });
  } else if (operation) {
    switch (operation) {
      case 'version':
        console.log(`Version: ${_package.default.version}`);
        break;

      case 'help':
      default: // TODO: Display help message

    }
  } else if (options.version) {
    console.log(`Version: ${_package.default.version}`);
  }
} catch (commandError) {
  (0, _shared.commandErrorHandler)(commandError);
}
//# sourceMappingURL=richmenu-cli.js.map