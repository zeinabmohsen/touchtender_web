const express = require("express");
const router = express.Router();
const {createDoctor,deleteDoctor,getAllDoctors,getDoctorById,updateDoctor,uploadImage} = require("../../controllers/doctorController");
const { protect } = require("../../controllers/authController");

router.post("/createdoctor", uploadImage, createDoctor);
router.delete("/deleteDoctor/:id",  deleteDoctor);
router.get("/" ,getAllDoctors);
router.get("/:id", getDoctorById);
router.put("/updatedoctor/:id",uploadImage, updateDoctor);

module.exports = router;
