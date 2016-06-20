'use strict';

var fs = require('graceful-fs');
var _ = require('lodash');
var url = require('url');

var HtaccessFile = require('./HtaccessFile');
var RewriteRule = require('./RewriteRule');
var RewriteCond = require('./RewriteCond');


function Parser(options, cb) {
  if(typeof options.file == 'undefined') {
    throw new Error('options.file not specified');
  }

  this.callback = cb;
  this.rules = [];

  fs.readFile(options.file, function (err, content) {
    if(err) {
      return this.callback(err);
    }


    this.content = content.toString().split('\n').filter(function (line) {
      var trimmed = line.trim();
      return trimmed.length > 0 && trimmed.substring(0, 1) != '#';
    });

    this.parseContent();
  }.bind(this));
}


Parser.prototype.parseContent = function () {
  var htaccessFile = new HtaccessFile();

  htaccessFile.RewriteBase = '/';

  var RewriteEngineActivated = false;
  var conditions = [];

  for(var i = 0; i < this.content.length; i++) {
    var line = this.content[i].trim();
    var parts = line.trim().split(' ').filter(function (part) {
      return part.length > 0;
    });

    var directive = parts[0];

    if(directive == 'RewriteEngine') {
      RewriteEngineActivated = (parts[1].toLowerCase() == 'on');
    }
    else if(directive == 'RewriteBase') {
      if(RewriteEngineActivated) {
        htaccessFile.RewriteBase = parts[1];
      }
    }
    else if(directive == 'RewriteCond') {
      if(RewriteEngineActivated) {
        var flags = typeof parts[3] == 'undefined' ? '' : parts[3];
        var condition = new RewriteCond(parts[1], parts[2], flags);
        conditions.push(condition);
      }
    }
    else if(directive == 'RewriteRule') {
      if(RewriteEngineActivated) {
        var flags = typeof parts[3] == 'undefined' ? '' : parts[3];
        var rule = new RewriteRule(parts[1], parts[2], flags, conditions);

        htaccessFile.RewriteRules.push(rule);

        conditions = [];
      }
    }
  }

  this.callback(null, htaccessFile);
};


module.exports = function (options, cb) {
  return (new Parser(options, cb));
};
