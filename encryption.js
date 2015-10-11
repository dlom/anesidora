var MCrypt = require("mcrypt").MCrypt;

exports.decrypt = function(password, ciphered, raw) {
    var decrypter = new MCrypt("blowfish", "ecb");
    decrypter.validateKeySize(false);
    decrypter.open(password);
    var buff = decrypter.decrypt(new Buffer(ciphered, "hex"));
    if (raw) return buff;
    return buff.toString("utf8");
};

exports.encrypt = function(password, plain, raw) {
    var encrypter = new MCrypt("blowfish", "ecb");
    encrypter.validateKeySize(false);
    encrypter.open(password);
    var buff = encrypter.encrypt(plain);
    if (raw) return buff;
    return buff.toString("hex").toLowerCase();
};
