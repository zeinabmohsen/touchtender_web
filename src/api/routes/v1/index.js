const express = require("express");
const app = express();

const AuthRoute = require("./authRoute.js")
const ActRoute = require("./activitiesRoute.js")
const CommunityRoute = require("./communityRoute.js")
const DoctorRoute = require("./doctorRoute.js")
const PlaceRoute = require("./placeRoute.js")
const router = express.Router();
router.use(express.json());

router.use("/auth", AuthRoute);
router.use("/activity", ActRoute);
router.use("/community", CommunityRoute);
router.use("/dr", DoctorRoute);
router.use("/place", PlaceRoute);

module.exports = router;
