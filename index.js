"use strict";

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var express = require('express');
var request = require('request');
var app = express();

var driver = new webdriver.Builder()
.forBrowser('chrome')
.build();

var currentUrl = '';

function goToUrl(req, res) {
    return driver.get(currentUrl)
        .then(function() { return true; })
        .catch(function(err){ return err; });
}

function getResource(req, res) {
    var resourceName = req.params.resource || '';
    var resourceUrl = 'http://' + currentUrl + (resourceName ? '/' + resourceName : '');
    return new Promise(function(resolve, reject){
        request({url: resourceUrl, encoding:null}, function(err, ress, body){
            if (err) return reject(err);
            return resolve({body:body, headers:ress.headers});
        });
    });
}

app.get('/*', function(req, res, next) {
    var host = req.originalUrl.substr(1);
    console.dir(host);
    if (host.match(/^(w{3}\.?)([^\/]*\.)(.{2,3}).*/)) currentUrl = host;
    console.dir(currentUrl);
    req.params.resource = (host === currentUrl ? '' : host);
    return getResource(req, res)
       .then(function(val) {res.pageSource = val.body; res.customHeaders = val.headers || {}; return;})
       .then(function(){return Object.keys(res.customHeaders).forEach(function(key){res.set(key, res.customHeaders[key]);});})
       .then(function(){return res.status(200).send(res.pageSource);})
       .catch(function(err) { next(err); });
});

app.use(function(err, req, res, next) {
    return res.status(400).send(err);
});

app.listen(3000, function() {
    console.log('Express running');
});

