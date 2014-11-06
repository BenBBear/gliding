/*!
 * gliding
 * Copyright(c) 2014 Xinyu Zhang bevis@mail.ustc.edu.cn
 * MIT Licensed
 */



String.prototype.startsWith = function(str) {
    return this.indexOf(str) === 0;
};
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.endsWithArray = function(arr) {
    for (var v = 0; v < arr.length; v++)
        if (this.endsWith(arr[v]))
            return true;
    return false;
};

Array.prototype.removeIndexAt = function(idx) {
    return this.slice(0, idx).concat(this.slice(idx + 1));
};


//////////////////////////////////////////////////////////////////

function mergeOptions(a, b) {
    for (var v in b) {
        a[v] = a[v] || b[v];
    }
    return updateOptions(a);
}

function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function isObject(obj) {
    return typeof obj == 'object';
}

function isString(obj) {
    return typeof obj == 'string';
}

function isRegex(obj) {
    return obj instanceof RegExp;
}

var isHidden = function(path) {
    return (/(^|.\/)\.+[^\/\.]/g).test(path) || (/~$/).test(path);
};

function updateOptions(options) {
    if (!options.PUBLIC.endsWith('/')) {
        options.PUBLIC = options.PUBLIC.concat('/');
    }
    if (!options.PATH.endsWith('/')) {
        options.PATH = options.PATH.concat('/');
    }
    if (options.PUBLIC.startsWith('/')) {
        options.PUBLIC = options.PUBLIC.slice(1);
    }
    options.PUBLIC = options.PATH + options.PUBLIC;
    return options;
}


exports.isFunction = isFunction;
exports.isObject = isObject;
exports.mergeOptions = mergeOptions;
exports.updateOptions = updateOptions;
exports.isString = isString;
exports.isRegex = isRegex;
exports.isHidden = isHidden;