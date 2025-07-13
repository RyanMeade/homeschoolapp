// tracer.mjs  – import first with  node --import ./tracer.mjs app.js
import express from "express";

// list every helper we care about
const verbs = ["use","route","all",
               "get","post","put","patch","delete","head","options"];

/* wrap any method so we log every string argument */
function wrap(obj, method) {
  if (typeof obj[method] !== "function") return;
  const original = obj[method];
  obj[method] = function (...args) {
    args.forEach((a,i) => {
      if (typeof a === "string") {
        console.error(`REGISTER ${method.padEnd(6)} arg${i}:`, JSON.stringify(a));
      }
    });
    return original.apply(this, args);
  };
}

/* patch the main application prototype */
verbs.forEach(v => wrap(express.application, v));

/* patch every router instance as soon as it is created */
const OrigRouter = express.Router;
express.Router   = function (...routerArgs) {
  const r = OrigRouter.apply(this, routerArgs);
  verbs.forEach(v => wrap(r, v));
  return r;
};

