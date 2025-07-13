import "./tap-router.js";  
import express from "express";



import {
  dbConnection,
  closeConnection,
} from "./mongoConfig/mongoConnection.js";




import session from "express-session";
import exphbs from "express-handlebars";
import path from "path";

const origStatic = express.static;
express.static = function (dir, options) {
  console.log("STATIC called with:", dir);
  return origStatic.call(this, dir, options);
};

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
import configRoutes from "./routes/index.js";














app.use(
    session({
        name: "AuthState",
        secret: "mysecretkey_2025$#*@!092&*(9dkjfhskdhf",
        resave: false,
        saveUninitialized: true,
    })
);

app.use("/public", express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.engine("handlebars", exphbs.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

try {
  await dbConnection();
} catch (err) {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
}
console.log("Connected to MongoDB");

app.use((req, res, next) => {
    const isAuthenticated = req.session.user && req.session.user;
    const userRole = isAuthenticated
        ? "Authenticated User"
        : "Non-Authenticated User";
    console.log(
        `[${new Date().toUTCString()}]: ${req.method} ${
            req.originalUrl
        } (${userRole})`
    );

    if (req.originalUrl === "/") {
        if (isAuthenticated) {
            return res.redirect("/protected");
        } else {
            return res.redirect("/login");
        }
    } else {
        next();
    }
});

app.use("/login", (req, res, next) => {
  if (req.method === "GET") {
    const isAuthenticated = req.session && req.session.user;
    if (isAuthenticated) {
      return res.redirect("/protected");
    }
  }
  next();
});

app.use("/register", (req, res, next) => {
    if (req.method === "GET") {
        const isAuthenticated = req.session && req.session.user;
        if (isAuthenticated) {
            return res.redirect("/protected");
        }
    }
    next();
});

app.use("/protected", (req, res, next) => {
    if (req.method === "GET") {
        const isAuthenticated = req.session && req.session.user;
        if (!isAuthenticated) {
            return res.redirect("/login");
        }
    }
    next();
});

app.use("/protected/:id", (req, res, next) => {
    if (req.method === "GET") {
        const isAuthenticated = req.session && req.session.user;
        if (!isAuthenticated) {
            return res.redirect("/login");
        }
    } else {
        next();
    }
    next();
});

app.use("/logout", (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect("/login");
    }
    next();
});

configRoutes(app);

console.log("Made it up to app.listen");


app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});

console.log("Made it past app.listen");







