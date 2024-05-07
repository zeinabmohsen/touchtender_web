const express = require("express");
const router = express.Router();
const { createPlace, deletePlace, getPlaceById,confirmPlace,rejectPlace,getAllApprovedPlaces,getApprovedPlaceCount,getAllPlacesByClassification,
     updatePlace, uploadImage ,getAllServices, getPendingPlaces ,getPendingPlaceCount ,
     createRating,getAverageRatingForPlace,getRatingsByUser,getRatingsForPlace ,updateRating
} = require("../../controllers/placesController");
const { protect } = require("../../controllers/authController");


router.post("/createplace",protect, uploadImage.array('photos', 5),  createPlace); // ok
router.delete("/:id", deletePlace);  //ok
router.get('/approved', getAllApprovedPlaces);//ok
router.get('/places/pending', getPendingPlaces);//ok
router.get('/:id', getPlaceById);//ok
router.get("/places/services", getAllServices);//ok
router.get("/places/classification/:classification", getAllPlacesByClassification);//
router.get("/approved/count", getApprovedPlaceCount);//ok
router.get("/pending/count", getPendingPlaceCount);//ok
router.put('/confirm-place/:id', confirmPlace); //ok
router.delete('/reject-place/:id', rejectPlace); //ok
router.put("/updateplace/:placeId", protect ,updatePlace);


router.post('/ratings/:placeId', createRating);

// Route to update an existing rating
router.put('/ratings/:placeId', updateRating);

// Route to get ratings for a specific place
router.get('/ratings/place/:placeId', getRatingsForPlace);

// Route to get ratings given by a specific user
router.get('/ratings/user/:userId', getRatingsByUser);

// Route to get average rating for a specific place
router.get('/ratings/average/:placeId', getAverageRatingForPlace);



module.exports = router;
