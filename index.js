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

function getResource(url, res) {
    console.dir('resource')
    console.dir(url);
    res.set('host', currentUrl)
    res.set('referer', currentUrl)
    return new Promise(function(resolve, reject){
        request({url: url, encoding:null, headers:{referer:currentUrl}}, function(err, ress, body){
            if (err) return reject(err);
           body = body.toString().replace('</body>', interceptorCode.toString()+'</body>');
            body = body.toString().replace(/((src|href)\s*=\s*("|'))(\/{1}\w+)/ig,"$1http://" + currentUrl + "$4")
            return resolve(body);
        })
    });
}

app.post('/event', function(req, res, next){
    execJs("return window.scrollMaxY")
        .then(function(height){
            return execJs("window.scrollTo(0, " + ((req.body.scroll*height)/100) + ")");
        })
        .then(function(){
            return res.sendStatus(200)
        })
        .catch(function(err){
            console.dir('ERR: ' + err);
        })
});

app.get('/http://:url([A-z0-9]+\.[A-z0-9]+\.[A-z0-9]+)/:res(*)*', (req, res, next) => {
    console.dir('hit!')
	console.dir(req.params)
    console.dir(req.originalUrl)
    if (req.params.url !== currentUrl) {
        currentUrl = req.params.url
    }

    return Promise.race([goToUrl(req.originalUrl.substr(1)), getResource(req.originalUrl.substr(1), res)])
        .then(function(body){return res.status(200).send(body);})
        .catch(function(err) { next(err); });

})

app.get('/*', function(req, res, next) {
    return getResource('http://' + currentUrl + req.originalUrl, res)
        .then(function(body){return res.status(200).send(body);})
        .catch(function(err) { next(err); });
});

app.use(function(err, req, res, next) {
    console.dir(err);
    return res.status(400).send(err);
});

app.listen(port, function() {
    console.log('Express running: ' + port);
});

