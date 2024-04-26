const express = require("express");
const router = express.Router();
const { createPlace, deletePlace, getPlaceById,confirmPlace,rejectPlace,getAllApprovedPlaces,getApprovedPlaceCount,
     updatePlace, uploadImage ,getAllServices, getPendingPlaces ,getPendingPlaceCount} = require("../../controllers/placesController");


router.post("/createplace", uploadImage.array('photos', 5),  createPlace); // ok
router.delete("/:id", deletePlace);  //ok
router.get('/approved', getAllApprovedPlaces);//ok
router.get('/places/pending', getPendingPlaces);//ok
router.get('/:id', getPlaceById);//ok
router.get("/places/services", getAllServices);//ok
router.get("/approved/count", getApprovedPlaceCount);//ok
router.get("/pending/count", getPendingPlaceCount);//ok
router.put('/confirm-place/:id', confirmPlace); //ok
router.delete('/reject-place/:id', rejectPlace); //ok
router.put("/updateplace/:placeId", updatePlace);

module.exports = router;
