console.log("Made it to routes/users.js");
import { Router } from "express";
const router = Router();
import { userAccount } from "../data/createUser.js";
import validation from "../data/validation.js";
import xss from 'xss';
import {
  loginUser,
  getUserByUsername,
  findUsersByUsernameSubstring,
  getFriendList,
  getUserById,
} from "../data/homeSchoolAppMongo.js";

router
  .route("/register")
  .get(async (req, res) => {
    return res.render("./register", {
      loggedIn: req.session.user ? true : false,
    });
  })
  .post(async (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "Not a valid JSON" });
    }
    const { userNameInput, passwordInput, confirmPasswordInput } = req.body;
    if (!userNameInput) {
      return res.status(400).json({ error: "Please supply User Name" });
    }
    if (!passwordInput) {
      return res.status(400).json({ error: "Please enter Password" });
    }
    if (!confirmPasswordInput) {
      return res.status(400).json({ error: "Please confirm Password" });
    }

    try {
      validation.checkString(userNameInput, "User Name");
      let newUser;

      try {
        newUser = await userAccount.createUser(userNameInput, passwordInput);
      } catch (err) {
        req.session.error = err.message;
        return res.status(403).redirect('error');
      }

      if (newUser.insertedUser === true) {
        res.redirect("/login");
      } else {
        res.status(500).render("register", {
          error: "Internal Server Error",
          loggedIn: req.session.user ? true : false
        });
      }
    } catch (error) {
      res.status(400).render("register", {
        error: error.message,
        loggedIn: req.session.user ? true : false
      });
    }
  });

router
  .route("/login")
  .get(async (req, res) => {
    res.render("login", {
      loggedIn: req.session.user ? true : false
    });
  })
  .post(async (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "Not a valid JSON" });
    }

    const { userNameInput, passwordInput } = req.body;

    if (!userNameInput || !passwordInput) {
      return res
        .status(400)
        .json({ error: "User Name and Password are required" });
    }

    try {
      if (!validation.checkString("User Name", userNameInput)) {
        throw new Error("Invalid User Name");
      }

      if (!validation.checkPassword(passwordInput)) {
        throw new Error("Invalid password.");
      }

      let newLogin;

      try {
        newLogin = await loginUser(userNameInput, passwordInput);
      } catch (err) {
        console.error("Login error:", err.message);
        req.session.error = err.message;
        return res.status(403).redirect("error");
      }

      if (newLogin) {
        req.session.user = {
          userName: newLogin.userName,
        };
      }

      req.session.save((error) => {
        if (error) {
          console.error("Session save error:", error);
          console.error(error);
          return res.status(500).render("login", {
            error: "Failed to save session.",
            loggedIn: req.session.user ? true : false
          });
        }
        return res.redirect("/protected");
      });
    } catch (error) {
      console.error("Critical error:", error);
      res.status(400).render("login", {
        error: error.message,
        loggedIn: req.session.user ? true : false
      });
    }
  });

router.route("/protected").get(async (req, res) => {
  if (!req.session.user) {
    req.session.error = "403: You do not have permission to access this page.";
    return res.status(403).redirect("error");
  }
  const sanitizedUsername = xss(req.session.user.userName);
  //const user = await getUserByUsername(req.session.user.userName);
  const user = await getUserByUsername(sanitizedUsername);
  const friendRequests = user.friendRequests;

  res.render("protected", {
    //userName: req.session.user.userName,
    userName: sanitizedUsername,
    currentTime: new Date().toLocaleTimeString(),
    friendRequests: friendRequests,
    loggedIn: req.session.user ? true : false
  });
});

router.route("/logout").get(async (req, res) => {
  if (!req.session.user) {
    req.session.error =
      "403: You are not logged in.  You can't log out if your aren't logged in.";
    loggedIn: req.session.user ? true : false;
    return res.status(403).redirect("error");
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Error deleting session cookie:", err);
    }
    res.clearCookie("AuthState");
    return res.render("./logout", {
      buttonsTurnedOff: true
    });
  });
});

// Route for handling search and adding friends
router
  .route("/searchUsers")
  .get(async (req, res) => {
    res.render("searchUsers", {
      loggedIn: req.session.user ? true : false
    });
  })
  .post(async (req, res) => {
    try {
      const { username } = req.body;

      const foundUsers = await findUsersByUsernameSubstring(username);

      if (foundUsers.length===0) {

        return res.render('searchUsers', { 
          message: "User not found",
          noMatch: true,
          loggedIn: req.session.user ? true : false
         });
      }

      res.render("searchUsers", { 
        users: foundUsers,
        loggedIn: req.session.user ? true : false,
        noMatch: true
       });
    } catch (error) {
      console.error("Error searching for user:", error);
      res.render('error', { 
        error: error.message,
        loggedIn: req.session.user ? true : false
       }); // Pass the error message to the error page
    }
  });

// Route for adding a friend
router.post("/addFriend", async (req, res) => {
  try {

    const senderUsername = xss(req.session.user.userName); // Retrieve sender's username from session user
    const receiverUsername = xss(req.body.username); // Retrieve receiver's username from form

    await userAccount.sendFriendRequest(senderUsername, receiverUsername);

    //res.redirect("/searchUsers");
    res.render('searchUsers', {
      requestSent: true,
      loggedIn: req.session.user ? true : false,
    });
  } catch (error) {
    console.error("Error adding friend:", error);
    res.render("error", { 
      error: error.message,
      loggedIn: req.session.user ? true : false
    });
  }
});


//These all need to be updated to our needs
router
  .route("/protected/:id")
  .get(async (req, res) => {
    let validatedId;
    try {
      //req.params.id = validation.checkId(req.params.id);
      validatedId = validation.checkId(xss(req.params.id));
    } catch (e) {
      return res.status(404).render("error", {
        error: "404: Page Not Found",
        loggedIn: req.session.user ? true : false
      });
    }
    try {
      const user = await homeSchoolAppMongo.getUserById(validatedId);
      return res.json(user);
    } catch (e) {
      return res.status(404).render("error", {
        error: "404: Page Not Found",
        loggedIn: req.session.user ? true : false
      });
    }
  })

  .post(async (req, res) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    let validatedId;
    try {
      //req.params.id = validation.checkId(req.params.id);
      validatedId = validation.checkId(xss(req.params.id));
    } catch (e) {
      return res.status(404).render("error", {
        error: "404: Page Not Found",
        loggedIn: req.session.user ? true : false
      });
    }
    return res.send(
      //`POST request to http://localhost:3000/users/${req.params.id}`
      `POST request to http://localhost:3000/users/${validatedId}`
    );
  })
  .delete(async (req, res) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    let validatedId;
    try {
      validatedId = validation.checkId(xss(req.params.id));
    } catch (error) {
      return res.status(400).send("Invalid ID provided.");
    }
    return res.send(
      //`DELETE request to http://localhost:3000/users/${req.params.id}`
      `DELETE request to http://localhost:3000/users/${validatedId}`
    );
  });



router.route('/error').get(async (req, res) => {

  const error = req.session.error; 
  req.session.error = null;

  const sanitizedError = xss(error);

  return res.render('error', {
    error: sanitizedError,
    loggedIn: req.session.user ? true : false,
  });
});
 //reject friend request
router.route("/rejectFriendRequest").post(async (req, res) => {
  try {
    const senderUsername = xss(req.body.username);
    const receiverUsername = xss(req.session.user.userName);

    await userAccount.rejectFriendRequest(receiverUsername, senderUsername);

    const updatedUser = await getUserByUsername(receiverUsername);
    const friendRequests = updatedUser.friendRequests || [];

    req.session.friendRequests = friendRequests;

    res.redirect('/protected');

  }
  catch (error) {
    console.error('Error rejecting friend:', error);
    res.render('error', { 
      error: error.message,
      loggedIn: req.session.user ? true : false 
    });
  }


});
//accept friend request
router.route("/acceptFriendRequest").post(async (req, res) => {
  try {
    const senderUsername = xss(req.body.username);
    const receiverUsername = xss(req.session.user.userName);

    await userAccount.acceptFriendRequest(receiverUsername,senderUsername);

    const updatedUser = await getUserByUsername(receiverUsername);
   
    const friendRequests = updatedUser.friendRequests || [];
   
    req.session.friendRequests = friendRequests;

    res.redirect('/protected');

  }

  catch (error) {
    console.error('Error accepting friend:', error);
    res.render('error', { 
      error: error.message,
      loggedIn: req.session.user ? true : false
    });
  }


});
//friend's list
router.route("/friendsList").get(async (req, res) => {
  if (req.session.user && req.session.user.userName) {
    try {
      const senderUsername = xss(req.session.user.userName);
      const friends = await userAccount.getAllFriends(senderUsername);
      res.render('friendsList', { 
        friends,
        loggedIn: req.session.user ? true : false
      });
    } catch (error) {
      console.log('An error occurred while finding friends:', error);
      res.render('error', { error: error.message });
    }
  }
  else {
    res.render('error', {
      error: "You are not logged in",
      loggedIn: req.session.user ? true : false
    })
  }
});

console.log("Made it to the end of routes/users.js");

export default router;
