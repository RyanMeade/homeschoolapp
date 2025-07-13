/*****************************************************************
 *  tap-router.js logic in-lined – logs EVERY string passed to   *
 *  app.use / router.use / router.route / HTTP verbs.            *
 *****************************************************************/
import express from "express";

function wrap(target, method) {
  const original = target[method];
  target[method] = function (...args) {
    args.forEach((a, idx) => {
      if (typeof a === "string") {
        console.log(`REGISTER ${method.padEnd(6)} arg${idx}:`, JSON.stringify(a));
      }
    });
    return original.apply(this, args);
  };
}

// patch application prototype
["use","all","get","post","put","patch","delete","head","options"]
  .forEach(m => wrap(express.application, m));

// patch every router that gets created
const origRouter = express.Router;
express.Router = function (...routerArgs) {
  const r = origRouter.apply(this, routerArgs);
  ["use","route","all","get","post","put","patch","delete","head","options"]
    .forEach(m => wrap(r, m));
  return r;
};
/*****************************************************************/


