const connection = require("../../config/database");
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: 'uploads/place',
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    const filename = `places-${uuidv4()}-${Date.now()}.${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  console.log('Received file mimetype:', file.mimetype);
  
  if (file.mimetype.startsWith('image') || file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jfif') {
    console.log('File mimetype matches allowed types.');
    cb(null, true);
  } else {
    console.log('File mimetype does not match allowed types.');
    cb(new Error('Only Images Allowed'), false);
  }
};

exports.uploadImage = multer({ storage, fileFilter });

exports.createPlace = async (req, res) => {
  try {
    const {  name, classification, region, city, services, location, role } = req.body;
    console.log(req.body);
    userid='4';

    // Validate user input
    if (!userid || !name || !classification || !region || !city || !services || !location) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Set default status based on role
    const status = role === 'parent' ? 'pending' : 'approved';

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/place/${file.filename}`);
    }

    // Insert new place record into the database
    connection.beginTransaction(async function (err) {
      if (err) {
        console.error('Error starting transaction: ' + err);
        return res.status(500).json({ error: 'An error occurred while creating the place.' });
      }

      try {
        // Insert into places table
        const insertPlaceQuery = 'INSERT INTO places (userid, name, classification, region, city, location, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const placeInsertResult = await queryAsync(insertPlaceQuery, [userid, name, classification, region, city, location, status]);
        const placeId = placeInsertResult.insertId;

        // Insert into place_services table
        const insertPlaceServicesQuery = 'INSERT INTO place_services (placeid, serviceid) VALUES (?, ?)';
        for (const serviceId of services) {
          await queryAsync(insertPlaceServicesQuery, [placeId, serviceId]);
        }

        // Insert photo URLs into photos table
        if (imageUrls.length > 0) {
          const insertPhotosQuery = 'INSERT INTO photos (placeid, photo_url) VALUES (?, ?)';
          for (const imageUrl of imageUrls) {
            await queryAsync(insertPhotosQuery, [placeId, imageUrl]);
          }
        }

        // Commit the transaction
        await connection.commit();

        console.log('New place added successfully.');

        const newPlace = {
          id: placeId,
          userid: userid,
          name: name,
          classification: classification,
          region: region,
          city: city,
          services: services,
          location: location,
          status: status,
          photo_urls: imageUrls
        };

        // If role is parent, send request to admin for confirmation
        if (role === 'parent') {
          // Send request to admin (e.g., via email, notification)
          console.log('Request sent to admin for confirmation');
          return res.status(201).json({ message: 'Place creation request sent for admin confirmation.', place: newPlace });
        } else {
          // Role is not parent, place is approved
          return res.status(201).json({ message: 'Place created and approved.', place: newPlace });
        }
      } catch (error) {
        await connection.rollback();
        console.error('Error creating place: ' + error);
        return res.status(500).json({ error: 'An error occurred while creating the place.' });
      }
    });
  } catch (error) {
    console.error('Error creating place: ' + error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};


exports.confirmPlace = async (req, res) => {
  try {
    const placeId = req.params.id;
    console.log("Confirming place with ID:", placeId);

    // Update place status to 'approved'
    const updatePlaceQuery = 'UPDATE places SET status = ? WHERE placeid = ?';
    await queryAsync(updatePlaceQuery, ['approved', placeId]);

    console.log('Place confirmed by admin.');

    return res.status(200).json({ message: 'Place confirmed by admin.' });
  } catch (error) {
    console.error('Error confirming place: ' + error);
    return res.status(500).json({ error: 'An error occurred while confirming the place.' });
  }
};

exports.rejectPlace = async (req, res) => {
  try {
    const placeId = req.params.id;

    // Begin a transaction to ensure atomicity
    await connection.beginTransaction();

    try {
      // Delete associated records from related tables (e.g., photos, place_services)
      const deletePhotosQuery = 'DELETE FROM photos WHERE placeid = ?';
      await queryAsync(deletePhotosQuery, [placeId]);

      const deletePlaceServicesQuery = 'DELETE FROM place_services WHERE placeid = ?';
      await queryAsync(deletePlaceServicesQuery, [placeId]);

      // Delete the place itself from the places table
      const deletePlaceQuery = 'DELETE FROM places WHERE placeid = ?';
      await queryAsync(deletePlaceQuery, [placeId]);

      // Commit the transaction
      await connection.commit();

      console.log('Place and associated records rejected by admin.');
      return res.status(200).json({ message: 'Place and associated records rejected by admin.' });
    } catch (error) {
      // Rollback the transaction if any error occurs
      await connection.rollback();
      console.error('Error rejecting place:', error);
      return res.status(500).json({ error: 'An error occurred while rejecting the place.' });
    }
  } catch (error) {
    console.error('Error rejecting place:', error);
    return res.status(500).json({ error: 'An error occurred while rejecting the place.' });
  }
};


exports.getPendingPlaces = async (req, res) => {
  try {
    // Retrieve all places with status 'pending'
    const getPendingPlacesQuery = 'SELECT * FROM places WHERE status = ?';
    const pendingPlaces = await queryAsync(getPendingPlacesQuery, ['pending']);

    // Loop through each pending place to fetch its photos and services
    for (const place of pendingPlaces) {
      const placeId = place.placeid;

      // Query to retrieve photos for the place
      const getPhotosQuery = 'SELECT * FROM photos WHERE placeid = ?';
      const photos = await queryAsync(getPhotosQuery, [placeId]);

      // Query to retrieve services for the place
      const getServicesQuery = `
        SELECT s.*
        FROM services s
        INNER JOIN place_services ps ON s.serviceid = ps.serviceid
        WHERE ps.placeid = ?`;
      const services = await queryAsync(getServicesQuery, [placeId]);

      // Assign photos and services to the place object
      place.photos = photos;
      place.services = services;
    }

    return res.status(200).json({ places: pendingPlaces });
  } catch (error) {
    console.error('Error retrieving pending places: ' + error);
    return res.status(500).json({ error: 'An error occurred while retrieving pending places.' });
  }
};


function queryAsync(sql, values) {
  return new Promise((resolve, reject) => {
      connection.query(sql, values, (err, results) => {
          if (err) {
              reject(err);
              return;
          }
          resolve(results);
      });
  });
}

exports.deletePlace = async (req, res) => {
  try {
    const placeId = req.params.id; // Assuming the place ID is passed as a parameter in the request URL

    // Check if the place exists
    const checkPlaceQuery = 'SELECT * FROM places WHERE placeid = ?';
    const place = await queryAsync(checkPlaceQuery, [placeId]);

    if (!place || place.length === 0) {
      return res.status(404).json({ error: 'Place not found.' });
    }

    // Begin a transaction to ensure atomicity
    await connection.beginTransaction();

    try {
      // Delete associated photos
      const deletePhotosQuery = 'DELETE FROM photos WHERE placeid = ?';
      await queryAsync(deletePhotosQuery, [placeId]);

      // Delete associated records from place_services
      const deletePlaceServicesQuery = 'DELETE FROM place_services WHERE placeid = ?';
      await queryAsync(deletePlaceServicesQuery, [placeId]);

      // Delete the place itself
      const deletePlaceQuery = 'DELETE FROM places WHERE placeid = ?';
      await queryAsync(deletePlaceQuery, [placeId]);

      // Commit the transaction
      await connection.commit();

      console.log('Place and associated records deleted successfully.');
      return res.status(200).json({ message: 'Place and associated records deleted successfully.' });
    } catch (error) {
      // Rollback the transaction if any error occurs
      await connection.rollback();
      console.error('Error deleting place:', error);
      return res.status(500).json({ error: 'An error occurred while deleting the place.' });
    }
  } catch (error) {
    console.error('Error deleting place:', error);
    return res.status(500).json({ error: 'An error occurred while deleting the place.' });
  }
};
  

  exports.updatePlace = async (req, res) => {
    try {
      const { placeId } = req.params;
      const { name, classification, region, city, service, location } = req.body;
  
      // Validate user input
      if (!placeId || !name || !classification || !region || !city || !service || !location) {
        return res.status(400).json({ error: 'All fields are required.' });
      }
  
      // Check if the place exists
      const place = await queryAsync('SELECT * FROM places WHERE placeid = ?', [placeId]);
  
      // Check if the place with the given ID exists
      if (place.length === 0) {
        return res.status(404).json({ error: 'Place not found.' });
      }
  
      let imageUrls = [];
  
      // Handle photo updates
      if (req.files && req.files.length > 0) {
        imageUrls = req.files.map(file => `/uploads/${file.filename}`);
  
        // Delete existing photos of the place from the database
        await queryAsync('DELETE FROM photos WHERE placeid = ?', [placeId]);
  
        // Insert new photos into the database
        for (const imageUrl of imageUrls) {
          await queryAsync('INSERT INTO photos (placeid, photo_url) VALUES (?, ?)', [placeId, imageUrl]);
        }
      }
  
      // Update the place information in the database
      await queryAsync('UPDATE places SET name = ?, classification = ?, region = ?, city = ?, serviceid = ?, location = ? WHERE placeid = ?', 
        [name, classification, region, city, service, location, placeId]);
  
      console.log('Place updated successfully.');
      return res.status(200).json({ message: 'Place updated successfully.' });
    } catch (error) {
      console.error('Error updating place: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };
  
  exports.getPlacesByClassification = async (req, res) => {
    try {
      const { classification } = req.params;
  
      // Retrieve places by classification from the database
      const places = await queryAsync('SELECT * FROM places WHERE classification = ?', [classification]);
  
      // Check if any places were found
      if (places.length === 0) {
        return res.status(404).json({ error: 'No places found for the specified classification.' });
      }
  
      console.log('Places fetched by classification successfully.');
      return res.status(200).json({ places });
    } catch (error) {
      console.error('Error fetching places by classification: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };

  exports.getAllServices = async (req, res) => {
    try {
      
      connection.query('SELECT * FROM services', (error, results) => {
        if (error) {
          console.error('Error getting all services: ' + error);
          return res.status(500).json({ error: 'An error occurred while fetching all services.' });
        }
  
        console.log('All services fetched successfully.');
        return res.status(200).json({ services: results });
      });
    } catch (error) {
      console.error('Error getting all services: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };

  exports.getAllApprovedPlaces = async (req, res) => {
    try {
      // Query to retrieve all approved places
      const getApprovedPlacesQuery = 'SELECT * FROM places WHERE status = ?';
      const approvedPlaces = await queryAsync(getApprovedPlacesQuery, ['approved']);
  
      // Loop through each approved place to fetch its photos and services
      for (const place of approvedPlaces) {
        const placeId = place.placeid;
  
        // Query to retrieve photos for the place
        const getPhotosQuery = 'SELECT * FROM photos WHERE placeid = ?';
        const photos = await queryAsync(getPhotosQuery, [placeId]);
  
        // Query to retrieve services for the place
        const getServicesQuery = `
          SELECT s.*
          FROM services s
          INNER JOIN place_services ps ON s.serviceid = ps.serviceid
          WHERE ps.placeid = ?`;
        const services = await queryAsync(getServicesQuery, [placeId]);
  
        // Assign photos and services to the place object
        place.photos = photos;
        place.services = services;
      }
  
      return res.status(200).json({ places: approvedPlaces });
    } catch (error) {
      console.error('Error retrieving approved places: ' + error);
      return res.status(500).json({ error: 'An error occurred while retrieving approved places.' });
    }
  };
    exports.getPlaceById = async (req, res) => {
    try {
      const placeId = req.params.id;
  
      // Query to retrieve place by ID
      const getPlaceQuery = 'SELECT * FROM places WHERE placeid = ?';
      const placeResult = await queryAsync(getPlaceQuery, [placeId]);
  
      if (!placeResult || placeResult.length === 0) {
        return res.status(404).json({ error: 'Place not found.' });
      }
  
      const place = placeResult[0];
  
      // Query to retrieve photos for the place
      const getPhotosQuery = 'SELECT * FROM photos WHERE placeid = ?';
      const photos = await queryAsync(getPhotosQuery, [placeId]);
  
      // Query to retrieve services for the place
      const getServicesQuery = `
        SELECT s.*
        FROM services s
        INNER JOIN place_services ps ON s.serviceid = ps.serviceid
        WHERE ps.placeid = ?`;
      const services = await queryAsync(getServicesQuery, [placeId]);
  
      // Construct response object
      const placeDetails = {
        id: place.placeid,
        userid: place.userid,
        name: place.name,
        classification: place.classification,
        region: place.region,
        city: place.city,
        location: place.location,
        status: place.status,
        photos: photos,
        services: services
      };
  
      return res.status(200).json({ place: placeDetails });
    } catch (error) {
      console.error('Error retrieving place by ID: ' + error);
      return res.status(500).json({ error: 'An error occurred while retrieving place by ID.' });
    }
  };

  exports.getApprovedPlaceCount = async (req, res) => {
    try {
      const countQuery = 'SELECT COUNT(placeid) AS approved_place_count FROM places WHERE status = ?';
      const result = await queryAsync(countQuery, ['approved']);
      const approvedPlaceCount = result[0].approved_place_count;
      return res.status(200).json({ place: approvedPlaceCount });
    } catch (error) {
      console.error('Error retrieving approved place count:', error);
      return res.status(500).json({ error: 'An error occurred while retrieving approved place count.' });
    }
  };

  exports.getPendingPlaceCount = async (req, res) => {
    try {
      const countQuery = 'SELECT COUNT(placeid) AS approved_place_count FROM places WHERE status = ?';
      const result = await queryAsync(countQuery, ['pending']);
      const approvedPlaceCount = result[0].approved_place_count;
      return res.status(200).json({ place: approvedPlaceCount });
    } catch (error) {
      console.error('Error retrieving approved place count:', error);
      return res.status(500).json({ error: 'An error occurred while retrieving approved place count.' });
    }
  };
  
  exports.getAllPlacesByClassification = async (req, res) => {
    try {
      const { classification } = req.params;
      
      // Validate classification input
      if (!classification) {
        return res.status(400).json({ error: 'Classification parameter is missing.' });
      }
  
      // Query to retrieve all places
      const getPlacesQuery = 'SELECT * FROM places WHERE classification = ?';
      const classPlaces = await queryAsync(getPlacesQuery, [classification]);
  
      // Loop through each place to fetch its photos and services
      for (const place of classPlaces) {
        const placeId = place.placeid;
  
        // Query to retrieve photos for the place
        const getPhotosQuery = 'SELECT * FROM photos WHERE placeid = ?';
        const photos = await queryAsync(getPhotosQuery, [placeId]);
  
        // Query to retrieve services for the place
        const getServicesQuery = `
          SELECT s.*
          FROM services s
          INNER JOIN place_services ps ON s.serviceid = ps.serviceid
          WHERE ps.placeid = ?`;
        const services = await queryAsync(getServicesQuery, [placeId]);
  
        // Assign photos and services to the place object
        place.photos = photos;
        place.services = services;
      }
  
      return res.status(200).json({ places: classPlaces });
    } catch (error) {
      console.error('Error retrieving approved places: ' + error);
      return res.status(500).json({ error: 'An error occurred while retrieving approved places.' });
    }
  };
  