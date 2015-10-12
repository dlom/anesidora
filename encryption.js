var MCrypt = require("mcrypt").MCrypt;

exports.decrypt = function(password, ciphered) {
    var decrypter = new MCrypt("blowfish", "ecb");
    decrypter.validateKeySize(false);
    decrypter.open(password);
    var buff = decrypter.decrypt(new Buffer(ciphered, "hex"));
    return buff;
};

exports.encrypt = function(password, plain) {
    var encrypter = new MCrypt("blowfish", "ecb");
    encrypter.validateKeySize(false);
    encrypter.open(password);
    var buff = encrypter.encrypt(plain);
    return buff;
};
