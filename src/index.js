const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
// Configure CORS to allow requests from vertueal.com and localhost:3000
const corsOptions = {
  origin: ["https://users.rodlip.org", "http://localhost:3000"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow cookies and HTTP authentication
  optionsSuccessStatus: 204, // No Content response for preflight requests
};
const app = express();
app.use(cors(corsOptions));
const usersRoutes = require("./routes/users.js");

app.use(cors());
app.use(bodyParser.json({ limit: "1000mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "1000mb", extended: true }));

app.use("/entities", usersRoutes);
//configuring mongoose
mongoose.set("strictQuery", true);
//connecting the database and starting the app
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("app listening at PORT: " + process.env.PORT);
    });
  })
  .catch((error) => {
    console.log(error.message);
  });
