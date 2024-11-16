"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserService", {
    enumerable: true,
    get: function() {
        return UserService;
    }
});
const _bcrypt = require("bcrypt");
const _typedi = require("typedi");
const _httpException = require("../exceptions/httpException");
const _usersmodel = require("../models/users.model");
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) {
            symbols = symbols.filter(function(sym) {
                return Object.getOwnPropertyDescriptor(object, sym).enumerable;
            });
        }
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let UserService = class UserService {
    async findAllUser() {
        const users = _usersmodel.UserModel;
        return users;
    }
    async findUserById(userId) {
        const findUser = _usersmodel.UserModel.find((user)=>user.id === userId);
        if (!findUser) throw new _httpException.HttpException(409, "User doesn't exist");
        return findUser;
    }
    async createUser(userData) {
        const findUser = _usersmodel.UserModel.find((user)=>user.email === userData.email);
        if (findUser) throw new _httpException.HttpException(409, `This email ${userData.email} already exists`);
        const hashedPassword = await (0, _bcrypt.hash)(userData.password, 10);
        const createUserData = _object_spread_props(_object_spread({}, userData), {
            id: _usersmodel.UserModel.length + 1,
            password: hashedPassword
        });
        return createUserData;
    }
    async updateUser(userId, userData) {
        const findUser = _usersmodel.UserModel.find((user)=>user.id === userId);
        if (!findUser) throw new _httpException.HttpException(409, "User doesn't exist");
        const hashedPassword = await (0, _bcrypt.hash)(userData.password, 10);
        const updateUserData = _usersmodel.UserModel.map((user)=>{
            if (user.id === findUser.id) user = _object_spread_props(_object_spread({}, userData), {
                id: userId,
                password: hashedPassword
            });
            return user;
        });
        return updateUserData;
    }
    async deleteUser(userId) {
        const findUser = _usersmodel.UserModel.find((user)=>user.id === userId);
        if (!findUser) throw new _httpException.HttpException(409, "User doesn't exist");
        const deleteUserData = _usersmodel.UserModel.filter((user)=>user.id !== findUser.id);
        return deleteUserData;
    }
};
UserService = _ts_decorate([
    (0, _typedi.Service)()
], UserService);

//# sourceMappingURL=users.service.js.map