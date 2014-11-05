/*!
 * gliding
 * Copyright(c) 2014 Xinyu Zhang bevis@mail.ustc.edu.cn
 * MIT Licensed
 */

var router = require('router');
var walk = require('walk'); // for file serving
var getArg = require('../util/getArg.js');
var mime = require('mime');
var url = require('url');
var path = require('path');
var fs = require('fs');

var clc = require('cli-color');
var error = clc.red.bold;
var warn = clc.yellow;
var notice = clc.blue.bgWhite;
var prettyjson = require('prettyjson');

function headPrint(res) {
    var options = {
        noColor: true
    };
    console.log(clc.yellow.inverse.bgWhite("HTTP HEADER:"));
    for (v in res.headers) {
        console.log(clc.blue.inverse.bgWhite(v + ': ') + res.headers[v]);
    }
}
var myRoute = function(options) {
    var rou = router();
    var simple_server = function(request, response) {
        headPrint(request);
        var pathname = url.parse(request.url).pathname;
        var realPath = options.PUBLIC + pathname.slice(1);
        fs.exists(realPath, function(exists) {
            if (!exists) {
                response.writeHead(404, {
                    'Content-Type': 'text/plain'
                });
                console.log(notice('request for ' + pathname + ' but 404 not found'));
                response.write("This request URL " + pathname + " was not found on this server.");
                response.end();
            } else {
                fs.readFile(realPath, "binary", function(err, file) {
                    if (err) {
                        response.writeHead(500, {
                            'Content-Type': 'text/plain'
                        });
                        console.log(error("INTERNAL ERROR:\n" + err));
                        response.write("This request URL " + pathname + ' cause internal error on this server.');
                        response.end();
                    } else {
                        var contentType = mime.lookup(realPath);
                        response.writeHead(200, {
                            'Content-Type': contentType
                        });
                        console.log(notice('request for ' + pathname + ' founded'));
                        response.write(file, "binary");
                        response.end();
                    }
                });

            }
        });
    };

    rou.get(options.STATIC_SERVER || simple_server);
    return rou;
};

var coreRoute = function(system) {
    var routeHandler = {}; // all functions in the routeHandler must accept request and response

    for (v in system.handler)
        routeHandler[v] = getRouteHandler(system.handler[v], system.handlerOptions[v], system.service);
    return routeHandler;
};

var getRouteHandler = function(funChain, options, service) {
    var f2arg = {};
    for (i in funChain) {
        var f = funChain[i],
            arg = getArg.getArguments(f);
        if (arg[0] != '$scope')
            throw new Error("Function \n" + f + "\n don't have $scope as the first argument\n");
        f2arg[f] = arg.slice(1);
    }
    var $final = service['$final'];
    if ($final != undefined) {
        arg = getArg.getArguments($final);
        if (arg[0] != '$scope')
            throw new Error("Provider $final don't have $scope as the first argument\n");
        f2arg[$final] = getArg.getArguments($final).slice(1);
    }
    //////////////////////////////////////////////////////////////////////////////
    return function(request, response) { //use bind
        debugger;
        var funQueue = [];
        copyArray(funQueue, funChain);
        var argQueue = [];
        argQueue.stage = undefined;

        ////////////////////////////now the two queue are ready
        var $scope = {};
        $scope.HTTP = {};
        $scope.HTTP.Request = request;
        $scope.HTTP.Response = response;
        $scope.PARAMS = request.params;
        $scope.HTTP.status = 200;
        $scope.HTTP.HEAD = 'text/html';
        var realArgList = [$scope];


        /////////////////////////////////////////////////////////////////////////////////
        function end() {
            if ($final != undefined) {
                if (argQueue.stage != $final) {
                    realArgList = [$scope];
                    funQueue.push($final);
                    fun2arg();
                    fall();
                }
            } else {
                final();
            }
        }

        function final() {

            response.writeHead($scope.HTTP.status, $scope.HTTP.Head);
            if ($scope.HTML != undefined) {
                response.write(service['$template'].render($scope.HTML, $scope.JSON));
                response.end();
            } else if ($scope.TMPL != undefined) {
                response.write(service['$render'].render($scope.TMPL, $scope.JSON));
                response.end();
            } else {
                response.write($scope.JSON);
                response.end();
            }
        }

        function fun2arg() {
            var f = dequeue(funQueue);
            copyArray(argQueue, f2arg[f]);
            argQueue.stage = f;
        }

        function fall(sv) { ////     this.callback = function(data, options, funChain)
                if (sv != undefined) // so you must pass a defined object when use it
                    realArgList.push(sv);
                if (argQueue.length == 0) {
                    if (argQueue.stage == undefined) { //be the first time
                        fun2arg();
                        fall();
                    } else {
                        if (funQueue.length == 0) { // also could be the end
                            argQueue.stage.apply(this, realArgList); //call the last function in the chain and do the final procedure
                            ///////////////////////////FINAL PROCEDURE//////////////////////////
                            end();
                        } else {
                            // get another fun from funChain, could terminated by null return. Also push $scope, and if this function has no argument, if not , then call directly
                            var retureValue = argQueue.stage.apply(this, realArgList);
                            if (retureValue != false) {
                                realArgList = [$scope];
                                fun2arg();
                                fall();
                            } else {
                                ////////////////// end soon
                                end();
                            }
                        }
                    }

                } else {
                    // callback and get another arg from argQueue, if this arg don't have callback, then it is an utility ,push it into the realArglist
                    var nowArg = dequeue(argQueue),
                        nowService = service[nowArg];

                    if (hasCallback(nowService)) {
                        nowService.callback($scope, options, fall);
                    } else {
                        realArgList.push(nowService);
                        fall();
                    }
                }
            }
            ////////////////////////////////////////////////////////////////////////////
        fall(); // 1 2 3!! jump!

    };
};


//////////////////////utility//////////////////////
function dequeue(a) {
    var x = a[0];
    a.shift();
    return x;
}


function enqueue(a, elm) {
    a.push(elm);
}

function hasCallback(a) {
    return a.hasOwnProperty('callback');
}

function copyArray(a, o) {
    for (var v in o) a[v] = o[v];
}


exports.Router = myRoute;
exports.coreRoute = coreRoute;