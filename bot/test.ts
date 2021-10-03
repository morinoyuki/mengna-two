"use strict";
let x: number;
initialize();
console.log(x + x);
//          ~   ~
// Error! Variable 'x' is used before being assigned.
function initialize() {
  x = 10;
}
