const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/*
    -> in order to create only one schema for a user, organization, department
    ->office, cubicle, fictional,
    ->we seperate them with an account type that can be either one of those
 */

const userSchema = new Schema(
  {
    email: { type: String, unique: true },
    password: String,
    name: String,
    age: Number,
    surname: String,
    username: String,
    instagram: String,
    linkedin: String,
    whatsapp: String,
    twitter: String,
    mobile: String,
    banner: String,
    image: String,
    address: String,
    state: String,
    region: String,
    country: String,
    gender: String,
    city: String,
    description: String,
    postal_code: String,
    profession: String,
  },
  { timestamps: true }
);

const usersModel = mongoose.model("user", userSchema);
module.exports = usersModel;
