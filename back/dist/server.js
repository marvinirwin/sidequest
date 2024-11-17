"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _app = require("./app");
const _validateEnv = require("./utils/validateEnv");
const _chatroute = require("./routes/chat.route");
(0, _validateEnv.ValidateEnv)();
const app = new _app.App([
    new _chatroute.ChatRoute()
]);
app.listen();

//# sourceMappingURL=server.js.map