var express = require("express");
var router = express.Router();
var Promise = require("bluebird");
var fs = require("fs");
var adb = require("adbkit");
var client = adb.createClient();
var path = require("path");
var PNG = require('pngjs').PNG;
var Jimp = require("jimp");
const del = require('del');
var tesseract = require('node-tesseract');
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' });


function findQuestion(content) {
  var tempArr = content.split('\n');
  var outStringArr = [];
  var questionLastLineIndex = 0;
  tempArr.forEach(function(val, index) {
    var string = val.trim();
    if(string.indexOf('?') !== -1){
      questionLastLineIndex = index;
    }
  });
  for(var i = questionLastLineIndex; i > 0; i--){
    var string = tempArr[i].trim();
    if(string !== ''){
      outStringArr.push(string);
    } else {
      break;
    }
  }
  outStringArr = outStringArr.reverse();
  return outStringArr.join(' ');
}

router.get("/", function(req, res, next) {
  console.log('request accepted');
  return new Promise(function(resolve, reject) {
    client
      .listDevices()
      .then(function(devices) {
        return Promise.map(devices, function(device) {
          return client
            .screencap(device.id)
            .then(function(data) {
              data.pipe(new PNG({
                filterType: 4
              }))
              .on('parsed', function() {
                var that = this;
                del([`${__basedir}/temp/*.png`]).then(paths => {
                  var stream = fs.createWriteStream(`${__basedir}/temp/out.png`);
                  that.pack().pipe(stream);
                  stream.on('close', function(){
                    Jimp.read(`${__basedir}/temp/out.png`, function(err, image) {
                      image.scale(0.5).write(`${__basedir}/temp/out.png`, function() {
                        tesseract.process(__basedir + '/temp/out.png',function(err, text) {
                          if(err){
                            res.send({
                              success: false
                            });
                          } else {
                            res.send({
                              success: true,
                              question: findQuestion(text)
                            });
                          }
                          console.log('response sent');
                        });
                      });
                    });
                  });
                });
              });
            })
            .catch(function(err) {
              console.log("screencap", err);
            });
        });
      })
      .catch(function(err) {
        resolve("fail", err);
      });
  }).then(function(data) {
    console.log("promise resolved", data);
  });
});

module.exports = router;
