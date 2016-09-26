var crypto = require("crypto");
var iv = new Buffer("");

var PADDING_LENGTH = 16;
var PADDING = Array(PADDING_LENGTH).join("\0");

var createCryptor = function(key) {
    key = new Buffer(key);
    return function(data) {
        var cipher = crypto.createCipheriv("bf-ecb", key, iv);
        cipher.setAutoPadding(false);
        var padLength = PADDING_LENGTH - (data.length % PADDING_LENGTH);
        if (padLength === PADDING_LENGTH) {
            padLength = 0;
        }
        try {
            return Buffer.concat([
                cipher.update(data + PADDING.substr(0, padLength)),
                cipher.final()
            ]);
        } catch (e) {
            return null;
        }
    };
};

var createDecryptor = function(key) {
    key = new Buffer(key);
    return function(data) {
        var cipher = crypto.createDecipheriv("bf-ecb", key, iv);
        cipher.setAutoPadding(false);
        try {
            return Buffer.concat([
                cipher.update(data),
                cipher.final()
            ]);
        } catch (e) {
            return null;
        }
    };
};

exports.decrypt = function(password, ciphered) {
    var blowfish = createDecryptor(password);
    var buff = blowfish(new Buffer(ciphered, "hex"));

    return buff;
};

exports.encrypt = function(password, plain) {
    var blowfish = createCryptor(password);
    var buff = blowfish(plain);

    return buff;
};
