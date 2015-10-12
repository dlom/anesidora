Anesidora
=========

A really simple wrapper on the Pandora JSON API.

Please note that at the moment, this package is limited to `nodejs@0.12.x` due to issues with mcrypt.
Follow along on [this issue](https://github.com/tugrul/node-mcrypt/issues/31).
I haven't figured out which versions of `io.js` are compatible with `mcrypt@0.0.15`, but once I do, I'll update the engine requirements.

## Installation

`npm install --save anesidora`

## Usage

```javascript
var Anesidora = require("anesidora");

var pandora = new Anesidora("email", "password");

pandora.login(function(err) {
    if (err) throw err;
    pandora.request("user.getStationList", function(err, stationList) {
        if (err) throw err;
        var station = stationList.stations[0];
        pandora.request("station.getPlaylist", {
            "stationToken": station.stationToken,
            "additionalAudioUrl": "HTTP_128_MP3"
        }, function(err, playlist) {
            if (err) throw err;
            var track = playlist.items[0];
            console.log("Playing '" + track.songName + "' by " + track.artistName);
            console.log(track.additionalAudioUrl);
        });
    });
});
```

## Documentation

See [here](http://6xq.net/pandora-apidoc/json/) for API documentation.
Authentication, encryption, and TLS are all handled automatically.
All you need is an email and a password, and you're good to go.

Handy links:

 - [List of methods](http://6xq.net/pandora-apidoc/json/methods/)
 - [List of error codes](http://6xq.net/pandora-apidoc/json/errorcodes/)

###`var pandora = new Anesidora(email, password, [config])`

Create a new Anesidora instance for making requests.
No authentication is done until `pandora.login` is called.

**config**

(Optional) a custom [partner config](http://6xq.net/pandora-apidoc/json/partners/#partners)

###`pandora.login(callback)`

Authenticate with Pandora.

**callback** - `function(err)`

Do ***all*** requests inside this callback.

###`pandora.request(method, [data], callback)`

Make a Pandora API call.

**method**

A Pandora API call [method](http://6xq.net/pandora-apidoc/json/methods/), such as `station.getPlaylist`.

**data**

(Optional) Data for the API call, if necessary.

**callback** - `function(err, result)`

 - `result` is the value returned from Pandora.  Refer to the individual method docs for more information.

