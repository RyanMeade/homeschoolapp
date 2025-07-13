import { userAccounts, allCards } from "../mongoConfig/mongoCollections.js";
import validation from "./validation.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";

/**
 *
 * @param {*} username username of the user
 * @returns all info in mongo on that user
 */
export const getUserByUsername = async (userName) => {
  if (!userName) {
    throw new Error("Must supply a user name");
  }
  let userNameCheckResult = validation.checkString(userName, userName);

  if (userNameCheckResult) {
    userName = userName.toLowerCase().trim();
  } else {
    throw new Error("Invalid User Name.");
  }

  try {
    const userAccountsCollection = await userAccounts();
    const user = await userAccountsCollection.findOne({ userName: userName });
    if (!user) {
      throw new Error(`No user found with the username: ${userName}`); //added check to see if user even exists, if not throw error. Need to check if anyone is resolving this error on their own by calling a null
    }
    return user;
  } catch (error) {
    console.error("Error getting user by username:", error);
    throw error;
  }
};

export const findUsersByUsernameSubstring = async (substring) => {
  if (!substring) {
    throw new Error("Must supply search term");
  }
  let substringCheckResult = validation.checkString(substring, substring);

  if (substringCheckResult) {
    substring = substring.toLowerCase().trim();
  } else {
    throw new Error("Invalid search query.");
  }

  try {
    const userAccountsCollection = await userAccounts();
    const users = await userAccountsCollection.find({ userName: { $regex: substring, $options: 'i' } 
  }).toArray();
    if (!users) {
      throw new Error(`No user found with the username: ${userName}`); //added check to see if user even exists, if not throw error. Need to check if anyone is resolving this error on their own by calling a null
    }
    return users;
  } catch (error) {
    console.error("Error getting user by username:", error);
    throw error;
  }
}

export const loginUser = async (userName, password) => {
  let username;
  let userNameCheckResult;
  let passwordCheckResult;
  const userAccountsCollection = await userAccounts();

  if (!userName || !password) {
    throw new Error("Must supply a User Name and a Password");
  } else {
    userNameCheckResult = validation.checkString(userName, username);
    passwordCheckResult = validation.checkPassword(password);
  }

  if (userNameCheckResult) {
    username = userName.toLowerCase().trim(); // Convert username to lowercase
  } else {
    throw new Error("Invalid User Name.");
  }

  if (!passwordCheckResult) {
    throw new Error("Password is invalid.");
  }

  const user = await userAccountsCollection.findOne({ userName: username });
  if (!user) {
    throw new Error("User not found");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (passwordMatch) {
    return {
      userName: user.userName,
      friendRequests: user.friendRequests
    };
  } else {
    throw new Error("User Name or Password is invalid");
  }
};

/**
 *
 * @param {*} username username of the user
 * @returns the cardlist of that user
 */


export const getUserById = async (id) => {
  id = validation.checkId(id);
  const userCollection = await userAccounts();
  const user = await userCollection.findOne({ _id: new ObjectId(id) });
  if (!user) throw "Error: User not found";
  return user;
};

export const getAllUsers = async () => {
  const userCollection = await userAccounts();
  const userList = await userCollection.find({}).toArray();
  return userList;
};



export async function getFriendList(user) {
  try {
    const userCollection = await userAccounts();
    const userInfo = await userCollection.findOne({ userName: user });
    //console.log("userInfo", userInfo)
    //console.log("friend list" , userInfo.friendList)
    if (userInfo) {
      if (userInfo.friendList.length === 0) {
        let list = [];
        //list.push(user)
        return list;
      } else {
        return userInfo.friendList;
      }
    } else {
      console.log(`User "${user}" not found.`);
      return [];
    }
  } catch (e) {
    console.log("Failed to get friend list: ", e);
  }
}