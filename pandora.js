var request = require("request");
var MCrypt = require("mcrypt").MCrypt;
var _ = require("underscore");

var ENDPOINT = "://tuner.pandora.com/services/json/";

var partnerInfo = {
    "username": "android",
    "password": "AC7IBG09A3DTSYM4R41UJWL07VLN8JI7",
    "deviceModel": "android-generic",
    "version": "5",
    "decryptPassword": "R=U!LH$O2B#",
    "encryptPassword": "6#26FRL$ZWD"
};

var endpoint = function(secure) {
    return (secure ? "https" : "http") + ENDPOINT;
};

var seconds = function() {
    return Date.now() / 1000 | 0;
};

var unwrap = function(callback) {
    return function(err, res, body) {
        if (err) return callback(err);
        var parsed = body;
        if (typeof parsed === "string") {
            parsed = JSON.parse(body);
        }
        if (parsed.stat === "fail") {
            return callback(new Error(parsed.message + " [" + parsed.code + "]"));
        } else if (parsed.stat === "ok") {
            return callback(null, parsed.result);
        } else {
            return callback(new Error("Unknown error"));
        }
    };
};

var decrypt = function(ciphered, raw) {
    var decrypter = new MCrypt("blowfish", "ecb");
    decrypter.validateKeySize(false);
    decrypter.open(partnerInfo.decryptPassword);
    var buff = decrypter.decrypt(new Buffer(ciphered, "hex"));
    if (raw) return buff;
    return buff.toString("utf8");
};

var decryptSyncTime = function(ciphered) {
    return parseInt(decrypt(ciphered, true).toString("utf8", 4, 14), 10);
};

var encrypt = function(plain, raw) {
    var encrypter = new MCrypt("blowfish", "ecb");
    encrypter.validateKeySize(false);
    encrypter.open(partnerInfo.encryptPassword);
    var buff = encrypter.encrypt(plain);
    if (raw) return buff;
    return buff.toString("hex").toLowerCase();
};

var partnerLogin = function(callback) {
    request({
        "method": "post",
        "url": endpoint(true),
        "qs": {
            "method": "auth.partnerLogin"
        },
        "body": JSON.stringify(_.omit(partnerInfo, ["decryptPassword", "encryptPassword"]))
    }, unwrap(function(err, result) {
        if (err) return callback(err);
        result.syncTimeOffset = decryptSyncTime(result.syncTime) - seconds();
        callback(null, result);
    }));
};

var userLogin = function(partnerData, username, password, callback) {
    request({
        "method": "post",
        "url": endpoint(true),
        "qs": {
            "method": "auth.userLogin",
            "auth_token": partnerData.partnerAuthToken,
            "partner_id": partnerData.partnerId
        },
        "body": encrypt(JSON.stringify({
            "loginType": "user",
            "username": username,
            "password": password,
            "partnerAuthToken": partnerData.partnerAuthToken,
            "syncTime": partnerData.syncTimeOffset + seconds()
        }))
    }, unwrap(callback));
};

var combinedLogin = function(username, password, callback) {
    partnerLogin(function(err, partner) {
        if (err) return callback(err);
        userLogin(partner, username, password, function(err, user) {
            if (err) return callback(err);
            var authData = {
                "userAuthToken": user.userAuthToken,
                "partnerId": partner.partnerId,
                "userId": user.userId,
                "syncTimeOffset": partner.syncTimeOffset
            };
            callback(null, authData);
        });
    });
};

var pandoraCall = function(authData, method, data, callback) {
    if (typeof data === "function" && callback == null) {
        callback = data;
        data = {};
    }
    var secure = false;
    if (method === "station.getPlaylist") secure = true;
    var body = _.defaults({
        "userAuthToken": authData.userAuthToken,
        "syncTime": authData.syncTimeOffset + seconds()
    }, data);
    request({
        "method": "post",
        "url": endpoint(secure),
        "qs": {
            "method": method,
            "auth_token": authData.userAuthToken,
            "partner_id": authData.partnerId,
            "user_id": authData.userId
        },
        "body": encrypt(JSON.stringify(body))
    }, unwrap(callback));
};

var pandora = function(email, password, method, data, callback) {
    combinedLogin(email, password, function(err, authData) {
        if (err) return callback(err);
        pandoraCall(authData, method, data, callback);
    });
};

module.exports = pandora;
pandora.login = combinedLogin;
pandora.raw = pandoraCall;
