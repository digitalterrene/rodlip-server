const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const usersModel = require("../models/usersModel.js");
require("dotenv").config();

// This is the token that we will use for authentication.
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};

// Verifying the token's validity. Whether it has been tempered with, or not
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    return decoded;
  } catch (error) {
    return null; // Return null for invalid tokens
  }
};

const registerUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
  } else if (!password) {
    res.status(400).json({ error: "Password is required" });
  } else {
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ error: "Invalid email, please try another one!" });
    }
    if (!validator.isStrongPassword(password)) {
      return res
        .status(400)
        .json({ error: "Weak password, please provide a stronger one!" });
    }
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      req.body.password = hash;
      const user = await usersModel.create(req.body);
      if (user) {
        const token = createToken(user._id);
        const res_user = { token, ...user._doc };
        //removing the password from the response obj
        delete res_user.password;
        res.status(200).json(res_user);
      }
    } catch (error) {
      if (
        error.message.includes("unique") ||
        error.message.includes("duplicate")
      ) {
        res.status(500).json({ error: "Email is already taken!" });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
};

//login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
  } else if (!password) {
    res.status(400).json({ error: "Password is required" });
  } else {
    try {
      const user = await usersModel.findOne({ email });
      if (!user) {
        res.status(400).json({ error: "Email does not exist" });
      }
      if (user) {
        const token = createToken(user._id);
        const validity = await bcrypt.compare(password, user.password);
        if (!validity) {
          res.status(400).json({ error: "Wrong password" });
        }
        if (validity) {
          const res_user = { token, ...user._doc };
          //removing the password from the response obj
          delete res_user.password;
          res.status(200).json(res_user);
        }
      }
    } catch (error) {
      res.status(500).json(error.message);
    }
  }
};

const fetchUser = async (req, res) => {
  const { id } = req.params;
  const auth_header = req.headers.authorization;

  if (!auth_header || !auth_header.startsWith("Bearer ")) {
    res.status(400).json({ error: "Access denied. No auth token provided" });
    return;
  }

  const token = auth_header.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(400).json({ error: "Access denied. Invalid auth token" });
    return;
  }

  try {
    const user = await usersModel.findById(id);
    if (!user) {
      res.status(400).json({ error: "User does not exist" });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//update user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { password, email } = req.body;
  const auth_header = req.headers.authorization;

  //checking token availability and registing requests with no token
  if (!auth_header || !auth_header.startsWith("Bearer ")) {
    res.status(400).json({ error: "Access denied. No auth token provided" });
    return;
  }
  const token = auth_header.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(400).json({ error: "Access denied. Invalid auth token" });
    return;
  }

  //verifying the email and password validity
  if (email && !validator.isEmail(email)) {
    return res
      .status(400)
      .json({ error: "Invalid email, please try another one!" });
  }
  if (password && !validator.isStrongPassword(password)) {
    return res
      .status(400)
      .json({ error: "Weak password, please provide a stronger one!" });
  }

  //processing the put request to the database
  try {
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      req.body.password = password_hash;
    }
    // Filter out keys with empty values from req.body
    const filteredBody = Object.keys(req.body).reduce(
      (objectKeyTodEdit, key) => {
        if (req.body[key].length > 0) {
          objectKeyTodEdit[key] = req.body[key];
        }
        return objectKeyTodEdit;
      },
      {}
    );
    const user = await usersModel.findByIdAndUpdate({ _id: id }, filteredBody, {
      new: true,
    });
    const newToken = createToken(user._id);
    res.status(200).json({ ...user, token: newToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// /api/user?search=piyush
const searchUsers = async (req, res) => {
  const { search_key, skip, limit } = req.params;
  try {
    if (search_key === "allFields") {
      const users = await usersModel
        .find({
          $or: [
            {
              name: { $regex: req.body.search_value, $options: "i" },
            },
            {
              surname: { $regex: req.body.search_value, $options: "i" },
            },
            {
              username: { $regex: req.body.search_value, $options: "i" },
            },
          ],
        })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .exec();
      res.status(200).json(users);
    } else {
      const users = await usersModel
        .find({
          $or: [
            {
              [search_key]: { $regex: req.body.search_value, $options: "i" },
            },
          ],
        })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .exec();
      res.status(200).json(users);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const fetchAllUsers = async (req, res) => {
  const { skip, limit } = req.params;
  try {
    const users = await usersModel
      .find({})
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .exec();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//deleting a user
const deleteUser = async (req, res) => {
  const { id } = req.params;
  const auth_header = req.headers.authorization;
  //checking token availability and registing requests with no token
  if (!auth_header || !auth_header.startsWith("Bearer ")) {
    res.status(400).json({ error: "Access denied. No auth token provided" });
    return;
  }
  const token = auth_header.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(400).json({ error: "Access denied. Invalid auth token" });
    return;
  }

  try {
    await usersModel.findByIdAndDelete(id);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updateUser,
  searchUsers,
  fetchAllUsers,
  deleteUser,
  fetchUser,
};
