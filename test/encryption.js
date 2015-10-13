var test = require("tape");
var encryption = require("../encryption");

var testString = "123456789";
var testPassword = "password";
var testEncrypted = "da6003664651d153815e183f310c8800"; // calculated using PHP's mcrypt_encrypt()

test("encryption.decrypt()", function(t) {
    t.plan(2);
    var buff = encryption.decrypt(testPassword, testEncrypted);
    t.ok(buff instanceof Buffer, "returns a buffer");
    var plain = buff.toString("utf8", 0, testString.length);
    t.equal(plain, testString, "decrypts correctly");
});

test("encryption.encrypt()", function(t) {
    t.plan(2);
    var buff = encryption.encrypt(testPassword, testString);
    t.ok(buff instanceof Buffer, "returns a buffer");
    var encrypted = buff.toString("hex");
    t.equal(encrypted, testEncrypted, "encrypts correctly");
});
