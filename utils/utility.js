exports.getArguments = getArguments;


var P = /\(.*\)\ *\{/;
function getArguments(f){
   var source = f.toString();
   var argStr = source.match(P)[0]; 
   var arg = argStr.removeALL('(',')',' ','{');
   return arg.split(',');
}

String.prototype.remove = function (c) {
    return this.replace(c,'');
};

String.prototype.removeAll = function(){
var t = this,
    i = 0;
while(i < arguments.length){
   t.remove(arguments[i]);
   i = i + 1;
 }
};


