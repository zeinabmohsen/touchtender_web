require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const db = require("./config/database");


const routes = require("./api/routes/v1/index");

const app = express();

// Serve static files from the /uploads directory
app.use('/uploads', express.static('uploads'));


// Middleware
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
    methods: "GET, POST, PUT, DELETE",
    credentials: true,
  })
);

// Session configuration
app.use(
    session({
      secret: process.env.COOKIE_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: false,
      },
    })
  );

// Routes
app.use("/v1", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Define port
const port = process.env.PORT || 3000;

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
