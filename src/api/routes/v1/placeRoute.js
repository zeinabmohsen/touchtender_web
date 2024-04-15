const express = require("express");
const router = express.Router();
const { createPlace, deletePlace, getAllPlaces, getPlaceById, updatePlace, uploadImage } = require("../../controllers/placesController");


router.post("/createplace", uploadImage.array('photos', 5),  createPlace);
router.delete("/deleteplace/:placeId", deletePlace);
router.get("/", getAllPlaces);
router.get("/:placeId", getPlaceById);
router.put("/updateplace/:placeId", updatePlace);

module.exports = router;
