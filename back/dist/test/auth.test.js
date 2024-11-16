"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _supertest = /*#__PURE__*/ _interop_require_default(require("supertest"));
const _app = require("../app");
const _authroute = require("../routes/auth.route");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
afterAll(async ()=>{
    await new Promise((resolve)=>setTimeout(()=>resolve(), 500));
});
describe('TEST Authorization API', ()=>{
    const route = new _authroute.AuthRoute();
    const app = new _app.App([
        route
    ]);
    describe('[POST] /signup', ()=>{
        it('response should have the Create userData', ()=>{
            const userData = {
                email: 'example@email.com',
                password: 'password123456789'
            };
            return (0, _supertest.default)(app.getServer()).post('/signup').send(userData).expect(201);
        });
    });
    describe('[POST] /login', ()=>{
        it('response should have the Set-Cookie header with the Authorization token', ()=>{
            const userData = {
                email: 'example1@email.com',
                password: 'password123456789'
            };
            return (0, _supertest.default)(app.getServer()).post('/login').send(userData).expect('Set-Cookie', /^Authorization=.+/).expect(200);
        });
    });
});

//# sourceMappingURL=auth.test.js.map