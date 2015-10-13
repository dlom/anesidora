var test = require("tape");
var config = require("./config");
var Anesidora = require("../anesidora");

test("Anesidora", function(t) {
    t.plan(2);
    t.equal(typeof Anesidora, "function", "is constructor");
    t.equal(Anesidora.ENDPOINT, "://tuner.pandora.com/services/json/", "has correct endpoint");
});

test("Anesidora()", function(t) {
    t.plan(4);
    var pandora = new Anesidora(config.email, config.password);
    t.deepEqual(pandora.partnerInfo, {
        "username": "android",
        "password": "AC7IBG09A3DTSYM4R41UJWL07VLN8JI7",
        "deviceModel": "android-generic",
        "decryptPassword": "R=U!LH$O2B#",
        "encryptPassword": "6#26FRL$ZWD",
        "version": "5"
    }, "has good default partner info");
    t.equal(pandora.username, config.email, "stored email");
    t.equal(pandora.password, config.password, "stored password");
    t.notOk(pandora.authData, "has not authed yet");
});

test("pandora.login()", function(t) {
    t.plan(4);
    var pandora = new Anesidora(config.email, config.password);
    pandora.login(function(err) {
        t.error(err, "did not error");
        t.ok(pandora.authData, "successfully authenticated");
        t.equal(typeof pandora.authData.syncTimeOffset, "number", "decrypted syncTime");
        t.test("pandora.request()", function(tt) {
            tt.plan(4);
            pandora.request("test.checkLicensing", function(err, result) {
                tt.error(err, "did not error");
                tt.equal(typeof result.isAllowed, "boolean", "makes a call with non-encrypted body");
            });
            pandora.request("user.getStationList", function(err, result) {
                tt.error(err, "did not error");
                tt.ok(Array.isArray(result.stations), "makes a call with encrypted body");
            });
        });
    });
});
