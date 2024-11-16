"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _supertest = /*#__PURE__*/ _interop_require_default(require("supertest"));
const _app = require("../app");
const _usersmodel = require("../models/users.model");
const _usersroute = require("../routes/users.route");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
afterAll(async ()=>{
    await new Promise((resolve)=>setTimeout(()=>resolve(), 500));
});
describe('TEST Users API', ()=>{
    const route = new _usersroute.UserRoute();
    const app = new _app.App([
        route
    ]);
    describe('[GET] /users', ()=>{
        it('response statusCode 200 /findAll', ()=>{
            const findUser = _usersmodel.UserModel;
            return (0, _supertest.default)(app.getServer()).get(`${route.path}`).expect(200, {
                data: findUser,
                message: 'findAll'
            });
        });
    });
    describe('[GET] /users/:id', ()=>{
        it('response statusCode 200 /findOne', ()=>{
            const userId = 1;
            const findUser = _usersmodel.UserModel.find((user)=>user.id === userId);
            return (0, _supertest.default)(app.getServer()).get(`${route.path}/${userId}`).expect(200, {
                data: findUser,
                message: 'findOne'
            });
        });
    });
    describe('[POST] /users', ()=>{
        it('response statusCode 201 /created', async ()=>{
            const userData = {
                email: 'example@email.com',
                password: 'password123456789'
            };
            return (0, _supertest.default)(app.getServer()).post(`${route.path}`).send(userData).expect(201);
        });
    });
    describe('[PUT] /users/:id', ()=>{
        it('response statusCode 200 /updated', async ()=>{
            const userId = 1;
            const userData = {
                password: 'password123456789'
            };
            return (0, _supertest.default)(app.getServer()).put(`${route.path}/${userId}`).send(userData).expect(200);
        });
    });
    describe('[DELETE] /users/:id', ()=>{
        it('response statusCode 200 /deleted', ()=>{
            const userId = 1;
            const deleteUser = _usersmodel.UserModel.filter((user)=>user.id !== userId);
            return (0, _supertest.default)(app.getServer()).delete(`${route.path}/${userId}`).expect(200, {
                data: deleteUser,
                message: 'deleted'
            });
        });
    });
});

//# sourceMappingURL=users.test.js.map