const express = require("express");
const router = express.Router();
const {createActivityForm} = require("../../controllers/activitiesController");

router.post("/createform",  createActivityForm);

module.exports = router;