const connection = require("../../config/database");
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: 'uploads',
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    const filename = `product-${uuidv4()}-${Date.now()}.${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Only Images Allowed'), false);
  }
};

exports.uploadImage = multer({ storage, fileFilter });

exports.createPlace = async (req, res) => {
    try {
        const { userid, name, classification, region, city, service, location } = req.body;
        const imageUrl = `/uploads/records/${req.file.filename}`;


        // Validate user input
        if (!userid || !name || !classification || !region || !city || !service || !location ) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Insert new place record into the database
        connection.beginTransaction(async function (err) {
            if (err) {
                console.error('Error starting transaction: ' + err);
                return res.status(500).json({ error: 'An error occurred while creating the place.' });
            }

            try {
                const insertPlaceQuery = 'INSERT INTO places (userid, name, classification, region, city, service, location) VALUES (?, ?, ?, ?, ?, ?, ?)';
                const [placeInsertResult] = await connection.execute(insertPlaceQuery, [userid, name, classification, region, city, service, location]);

                const placeId = placeInsertResult.insertId;

                const insertPhotosQuery = 'INSERT INTO photos (placeid, photo_url) VALUES (?, ?)';
                const photoInsertValues = photos.map(photoUrl => [placeId, imageUrl]);
                await connection.execute(insertPhotosQuery, photoInsertValues);

                await connection.commit();

                console.log('New place added successfully.');

                const newPlace = {
                    id: placeId,
                    userid: userid,
                    name: name,
                    classification: classification,
                    region: region,
                    city: city,
                    service: service,
                    location: location,
                    photos: photos
                };

                return res.status(201).json({ message: 'Place created successfully.', place: newPlace });
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

  exports.deletePlace = async (req, res) => {
    try {
      const { placeId } = req.params;
  
      // Check if placeId is provided
      if (!placeId) {
        return res.status(400).json({ error: 'Place ID is required.' });
      }
  
      // Delete the place from the database
      connection.query('DELETE FROM places WHERE placeid = ?', [placeId], (error, results) => {
        if (error) {
          console.error('Error deleting place: ' + error);
          return res.status(500).json({ error: 'An error occurred while deleting the place.' });
        }
  
        // Check if any place was deleted
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Place not found.' });
        }
  
        console.log('Place deleted successfully.');
  
        return res.status(200).json({ message: 'Place deleted successfully.' });
      });
    } catch (error) {
      console.error('Error deleting place: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
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
      connection.query('SELECT * FROM places WHERE placeid = ?', [placeId], (error, results) => {
        if (error) {
          console.error('Error updating place: ' + error);
          return res.status(500).json({ error: 'An error occurred while updating the place.' });
        }
  
        // Check if the place with the given ID exists
        if (results.length === 0) {
          return res.status(404).json({ error: 'Place not found.' });
        }
  
        // Update the place in the database
        connection.query('UPDATE places SET name = ?, classification = ?, region = ?, city = ?, service = ?, location = ? WHERE placeid = ?', 
          [name, classification, region, city, service, location, placeId], (error, results) => {
          if (error) {
            console.error('Error updating place: ' + error);
            return res.status(500).json({ error: 'An error occurred while updating the place.' });
          }
  
          console.log('Place updated successfully.');
  
          return res.status(200).json({ message: 'Place updated successfully.' });
        });
      });
    } catch (error) {
      console.error('Error updating place: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };
  


  exports.getAllPlaces = async (req, res) => {
    try {
      // Retrieve all places from the database
      connection.query('SELECT * FROM places', (error, results) => {
        if (error) {
          console.error('Error fetching places: ' + error);
          return res.status(500).json({ error: 'An error occurred while fetching places.' });
        }
  
        console.log('Places fetched successfully.');
  
        return res.status(200).json({ places: results });
      });
    } catch (error) {
      console.error('Error fetching places: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };
  
  exports.getPlacesByUserId = async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Retrieve places by user ID from the database
      connection.query('SELECT * FROM places WHERE userid = ?', [userId], (error, results) => {
        if (error) {
          console.error('Error fetching places by user ID: ' + error);
          return res.status(500).json({ error: 'An error occurred while fetching places.' });
        }
  
        console.log('Places fetched by user ID successfully.');
  
        return res.status(200).json({ places: results });
      });
    } catch (error) {
      console.error('Error fetching places by user ID: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };
  
  exports.getPlaceById = async (req, res) => {
    try {
      const { placeId } = req.params;
  
      // Retrieve place by place ID from the database
      connection.query('SELECT * FROM places WHERE placeid = ?', [placeId], (error, results) => {
        if (error) {
          console.error('Error fetching place by ID: ' + error);
          return res.status(500).json({ error: 'An error occurred while fetching place.' });
        }
  
        // Check if place with given ID exists
        if (results.length === 0) {
          return res.status(404).json({ error: 'Place not found.' });
        }
  
        console.log('Place fetched by ID successfully.');
  
        return res.status(200).json({ place: results[0] });
      });
    } catch (error) {
      console.error('Error fetching place by ID: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };
  