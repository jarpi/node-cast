"use strict";

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/firefox');
var express = require('express');
var request = require('request');
var app = express();

var driver = new webdriver.Builder()
.forBrowser('firefox')
.build();

var currentUrl = '';

function goToUrl(url) {
    if (!url || url[0] === currentUrl) return Promise.resolve(false);
    return driver.get(url[0])
        .then(function() {return; })
}

function getResource(req, res) {
    var resourceName = req.params.resource || '';
    var resourceUrl = 'http://' + currentUrl + (resourceName ? '/' + resourceName : '');
    console.dir(resourceUrl);
    return new Promise(function(resolve, reject){
        request({url: resourceUrl, encoding:null, headers:{referer:currentUrl}}, function(err, ress, body){
            if (err) return reject(err);
            ress.headers['host'] = currentUrl;
            ress.headers['referer'] = currentUrl;
            return resolve({body:body, headers:ress.headers});
        });
    });
}

app.get('/*', function(req, res, next) {
    var host = req.originalUrl.substr(1);
    var matchedHost = host.match(/http:\/\/([^\/]*\.{1}[A-z]{2,3})\/?.*/);
    req.params.resource = (matchedHost || host === currentUrl ? '' : host);
    return goToUrl(matchedHost).then(function(){if (matchedHost && matchedHost[0] && currentUrl !== matchedHost[0]) {currentUrl = matchedHost[0].substr(matchedHost[0].indexOf('://')+3); return; }})
       .then(function(){ return getResource(req, res) })
       .then(function(val) {res.pageSource = val.body; res.customHeaders = val.headers || {}; return;})
       .then(function(){return Object.keys(res.customHeaders).forEach(function(key){res.set(key, res.customHeaders[key]);});})
       .then(function(){return res.status(200).send(res.pageSource);})
       .catch(function(err) { next(err); });
});

app.use(function(err, req, res, next) {
    console.dir(err);
    return res.status(400).send(err);
});

app.listen(3000, function() {
    console.log('Express running');
});

