"use strict";

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    logger = require('winston'),
    childProcess = require('child_process');


/* Lo-Dash plugins */

_.mixin({
    compactObject: function (o) {
        var res = {};
        _.each(o, function (v, k) {
            if (v) {
                res[k] = v;
            }
        });
        return res;
    }
});

_.mixin({
    filterByCollection: function (o, c) {
        var res = {};
        _.each(o, function (v, k) {
            if (_.contains(c, k)) {
                res[k] = v;
            }
        });
        return res;
    }
});


/* BASE64 functions */

function encodeBase64(json) {
    return new Buffer(JSON.stringify(json), 'binary').toString('base64');
}


/* Functions to work with FS */

function filePath(file) {
    return path.normalize(path.join(__dirname, file));
}

function runFsWatchdog(dir, timeout, callback) {
    if (dir && (timeout > 0)) {
        return setInterval(function () {
            fs.readdir(dir, function (err, files) {
                files.forEach(function (file) {
                    var filePath = path.join(dir, file);
                    fs.stat(filePath, function (err, stat) {
                        var endTime, now;
                        if (err) {
                            return logger.error(err);
                        }
                        now = new Date().getTime();
                        endTime = new Date(stat.ctime).getTime() + timeout;
                        if (now > endTime) {
                            return callback(filePath);
                        }
                    });
                });
            });
        }, timeout);
    }
    return null;
}


/* Functions to work with processes */

function execProcess(cmd, args, onClose) {
    var proc = childProcess.spawn(cmd, args),
        procStart = process.hrtime();

    proc.stdout.on('data', function (data) {
        logger.debug('Output: %s', data.toString());
    });
    proc.stderr.on('data', function (data) {
        logger.error('Error: %s', data.toString());
    });
    proc.on('close', function(code) {
        var procEnd = process.hrtime(procStart);
        var end = (procEnd[0] + procEnd[1] / 1e9).toFixed(2);
        logger.debug('Execution time: %d sec', end);
        onClose(code);
    });
}


/* Export functions */

module.exports = {
    encodeBase64: encodeBase64,
    filePath: filePath,
    runFsWatchdog: runFsWatchdog,
    execProcess: execProcess
};
