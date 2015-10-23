var request = require("request");
var _ = require("underscore");
var encryption = require("./encryption");

var Anesidora = (function() {
    var Anesidora = function(username, password, partnerInfo) {
        if (partnerInfo == null) {
            partnerInfo = {
                "username": "android",
                "password": "AC7IBG09A3DTSYM4R41UJWL07VLN8JI7",
                "deviceModel": "android-generic",
                "decryptPassword": "R=U!LH$O2B#",
                "encryptPassword": "6#26FRL$ZWD"
            };
        }
        this.username = username;
        this.password = password;
        this.partnerInfo = _.extend(partnerInfo, {"version": "5"});
        this.authData = null;
    };

    Anesidora.ENDPOINT = "://tuner.pandora.com/services/json/";
    var endpoint = function(secure) {
        return (secure ? "https" : "http") + Anesidora.ENDPOINT;
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

    var decryptSyncTime = function(password, ciphered) {
        return parseInt(encryption.decrypt(password, ciphered).toString("utf8", 4, 14), 10);
    };

    var partnerLogin = function(partnerInfo, callback) {
        request({
            "method": "post",
            "url": endpoint(true),
            "qs": {
                "method": "auth.partnerLogin"
            },
            "body": JSON.stringify(_.omit(partnerInfo, ["decryptPassword", "encryptPassword"]))
        }, unwrap(function(err, result) {
            if (err) return callback(err);
            result.syncTimeOffset = decryptSyncTime(partnerInfo.decryptPassword, result.syncTime) - seconds();
            callback(null, result);
        }));
    };

    var userLogin = function(encryptPassword, partnerData, username, password, callback) {
        request({
            "method": "post",
            "url": endpoint(true),
            "qs": {
                "method": "auth.userLogin",
                "auth_token": partnerData.partnerAuthToken,
                "partner_id": partnerData.partnerId
            },
            "body": encryption.encrypt(encryptPassword, JSON.stringify({
                "loginType": "user",
                "username": username,
                "password": password,
                "partnerAuthToken": partnerData.partnerAuthToken,
                "syncTime": partnerData.syncTimeOffset + seconds()
            })).toString("hex").toLowerCase()
        }, unwrap(callback));
    };

    Anesidora.prototype.login = function(callback) {
        var that = this;
        partnerLogin(that.partnerInfo, function(err, partner) {
            if (err) return callback(err);
            userLogin(that.partnerInfo.encryptPassword, partner, that.username, that.password, function(err, user) {
                if (err) return callback(err);
                that.authData = {
                    "userAuthToken": user.userAuthToken,
                    "partnerId": partner.partnerId,
                    "userId": user.userId,
                    "syncTimeOffset": partner.syncTimeOffset
                };
                callback(null);
            });
        });
    };

    Anesidora.prototype.request = function(method, data, callback) {
        var that = this;
        if (typeof data === "function" && callback == null) {
            callback = data;
            data = {};
        }

        if (that.authData == null) {
            return callback(new Error("Not authenticated with Pandora (call login() before request())"));
        }

        var secure = false;
        if (method === "station.getPlaylist") secure = true;
        var body = _.extend(data, {
            "userAuthToken": that.authData.userAuthToken,
            "syncTime": that.authData.syncTimeOffset + seconds()
        });
        var encryptedBody = encryption.encrypt(that.partnerInfo.encryptPassword, JSON.stringify(body)).toString("hex").toLowerCase();
        if (method === "test.checkLicensing") encryptedBody = null;
        request({
            "method": "post",
            "url": endpoint(secure),
            "qs": {
                "method": method,
                "auth_token": that.authData.userAuthToken,
                "partner_id": that.authData.partnerId,
                "user_id": that.authData.userId
            },
            "body": encryptedBody
        }, unwrap(callback));
    };

    return Anesidora;
})();

module.exports = Anesidora;
