"use strict";

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var express = require('express');
var app = express();
var request = require('request');
var iconv  = require('iconv-lite');

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
    var resourceUrl = currentUrl + '/' + resourceName;
    return new Promise(function(resolve, reject){
        request({url: resourceUrl }, function(err, ress, body){
            return resolve({body:body, headers:ress.headers});
        });
    });
}

app.use(function(err, req, res, next) {
    return res.status(400).send(err);
});

app.get('/to/:url', function(req, res, next) {
    currentUrl = 'http://' + req.params.url.substr(req.params.url.indexOf('/to/')+1);
    return goToUrl(req, res)
       .then(function(isLoaded){ return getResource(req, res); })
       .then(function(val) { res.pageSource = val.body; res.customHeaders = val.headers || {}; return;})
       .then(function(){return Object.keys(res.customHeaders).forEach(function(key){res.set(key, res.customHeaders[key]);});})
       .then(function(){return res.status(200).send(res.pageSource);})
       .catch(function(err) { return next(err); });

});

app.get('/*', function(req, res, next) {
    req.params.resource = req.params['0'];
    return getResource(req, res)
       .then(function(val) {res.pageSource = val.body; res.customHeaders = val.headers || {}; return;})
       .then(function(){return Object.keys(res.customHeaders).forEach(function(key){res.set(key, res.customHeaders[key]);});})
       .then(function(){return res.status(200).send(res.pageSource);})
       .catch(function(err) { next(err); });
});

app.listen(3000, function() {
    console.log('Express running');
});

