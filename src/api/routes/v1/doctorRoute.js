const express = require("express");
const router = express.Router();
const {createDoctor,deleteDoctor,getAllDoctors,getDoctorById,updateDoctor} = require("../../controllers/doctorController");

router.post("/createdoctor",  createDoctor);
router.delete("/deleteDoctor/:id",  deleteDoctor);
router.get("/", getAllDoctors);
router.get("/:id", getDoctorById);
router.put("/updatedoctor/:id", updateDoctor);

module.exports = router;
