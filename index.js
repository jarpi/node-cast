"use strict";

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/firefox');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var fs = require('fs');
var port = 5000;
app.use(bodyParser.json());

var driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

var currentUrl = '';
var interceptorCode = fs.readFileSync('./interceptor.js', 'utf8');

function execJs(code) {
    return driver.executeScript(code)
        .then(function(res){
            return res;
        })
        .catch(function(err){
            console.dir('EXECJS ERR: ' + err);
            return null;
        });
}

function goToUrl(url) {
    if (!url || url === currentUrl) return Promise.resolve(false);
    return driver.get(url)
        .then(function() {return; })
}

function getResource(req, res) {
    var resourceName = req.params.resource || '';
    var resourceUrl = 'http://' + currentUrl + (resourceName ? '/' + resourceName : '');
    console.dir('resource')
    console.dir(resourceUrl);
    return new Promise(function(resolve, reject){
        request({url: resourceUrl, encoding:null, headers:{referer:currentUrl}}, function(err, ress, body){
            if (err) return reject(err);
            res.set('host', currentUrl)
            res.set('referer', currentUrl)
            if (resourceUrl === currentUrl) console.log(1); body = body.toString().replace('</body>', interceptorCode.toString()+'</body>');
            return resolve(body);
        });
    });
}

app.post('/event', function(req, res, next){
    execJs("return window.scrollMaxY")
        .then(function(height){
            return execJs("window.scrollTo(0, " + ((req.body.scroll*height)/100) + ")");
        })
        .then(function(){
            return res.status(200).send();
        })
        .catch(function(err){
            console.dir('ERR: ' + err);
        })
});

app.get('/http://:url(*)', (req, res, next) => {
    console.dir('hit!')
    return goToUrl(req.originalUrl.substr(1))
        .then(function updateCurrentUrl(){
            if (req.params.url !== currentUrl) {
                currentUrl = req.params.url
            }
            return
        })
        .then(function(){ return getResource(req, res) })
        .then(function(body){return res.status(200).send(body);})
        .catch(function(err) { next(err); });

})

app.get('/*', function(req, res, next) {
    var host = req.originalUrl.substr(1);
    var matchedHost = host.match(/http:\/\/([^\/]*\.{1}[A-z]{2,3})\/?.*/);
    console.dir(host)
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

app.listen(port, function() {
    console.log('Express running: ' + port);
});

