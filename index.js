var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var express = require('express');
var app = express();

var driver = new webdriver.Builder()
.forBrowser('chrome')
.build();

var url = 'http://play.flaix.webtv.flumotion.com/play/player?player=22&pod=15&backgroundColor=#/FFFFFF&poster=http://go.spreadthefox.net/300x250-white.png&endOfVideoOverlay=http://go.spreadthefox.net/300x250-white.png';

function goToUrl(url) {
    return driver.get('http://' + url)
    .then(function(loaded) { return driver.getPageSource(); });
}

app.get('/:url', function(req, res) {
    console.log(req.params.url);
    return goToUrl(req.params.url)
           .then(function(pageSource) { return res.status(200).send(pageSource)})
           .catch(function(err) { return res.status(500).send(err)});
});

app.listen(3000, function() {
console.log('Express running');
});


