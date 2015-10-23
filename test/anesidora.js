var test = require("tape");
var Anesidora = require("../anesidora");

var config = {
    "email": process.env.PANDORA_EMAIL,
    "password": process.env.PANDORA_PASSWORD,
    "partnerConfig": {
        "username": "android",
        "password": "AC7IBG09A3DTSYM4R41UJWL07VLN8JI7",
        "deviceModel": "android-generic",
        "decryptPassword": "R=U!LH$O2B#",
        "encryptPassword": "6#26FRL$ZWD"
    }
};

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
    t.plan(3);
    var pandora = new Anesidora(config.email, config.password);
    pandora.login(function(err) {
        t.error(err, "did not error (login)");
        t.ok(pandora.authData, "successfully authenticated");
        t.equal(typeof pandora.authData.syncTimeOffset, "number", "decrypted syncTime");
    });
});

test("pandora.request()", function(t) {
    t.plan(6);
    var pandora = new Anesidora(config.email, config.password);
    pandora.request("user.getStationList", function(err, result) {
        t.assert(err != null && err instanceof Error, "did error when not authenticated");
        pandora.login(function(err) {
            t.error(err, "did not error (login)")
            pandora.request("test.checkLicensing", function(err, result) {
                t.error(err, "did not error (checkLicensing)");
                t.equal(typeof result.isAllowed, "boolean", "makes a call with non-encrypted body");
            });
            pandora.request("user.getStationList", function(err, result) {
                t.error(err, "did not error (getStationList)");
                t.ok(Array.isArray(result.stations), "makes a call with encrypted body");
            });
        });
    });
});
