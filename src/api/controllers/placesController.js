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
    const { userid, name, classification, region, city, service, location } = req.body;
    console.log(req.files);

    // Validate user input
    if (!userid || !name || !classification || !region || !city || !service || !location ) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
        imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    }

    // Insert new place record into the database
    connection.beginTransaction(async function (err) {
        if (err) {
            console.error('Error starting transaction: ' + err);
            return res.status(500).json({ error: 'An error occurred while creating the place.' });
        }

        try {
            const insertPlaceQuery = 'INSERT INTO places (userid, name, classification, region, city, serviceid, location) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const placeInsertResult = await queryAsync(insertPlaceQuery, [userid, name, classification, region, city, service, location]);

            const placeId = placeInsertResult.insertId;

            for (const imageUrl of imageUrls) {
                const insertPhotosQuery = 'INSERT INTO photos (placeid, photo_url) VALUES (?, ?)';
                await queryAsync(insertPhotosQuery, [placeId, imageUrl]);
            }

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
                photo_urls: imageUrls
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
  
  
  exports.getAllPlaces = async (req, res) => {
    try {
      // Retrieve all places from the database
      const places = await queryAsync('SELECT * FROM places');
      console.log('Places fetched successfully.');
      return res.status(200).json({ places });
    } catch (error) {
      console.error('Error fetching places: ' + error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  };
  
  exports.getPlaceById = async (req, res) => {
    try {
      const { placeId } = req.params;
  
      // Retrieve place details including service name and photo URLs by place ID from the database
      const query = `
        SELECT places.*, services.servicename AS service_name, photos.photo_url
        FROM places
        INNER JOIN services ON places.serviceid = services.serviceid
        LEFT JOIN photos ON places.placeid = photos.placeid
        WHERE places.placeid = ?
      `;
      const results = await queryAsync(query, [placeId]);
  
      // Check if place with given ID exists
      if (results.length === 0) {
        return res.status(404).json({ error: 'Place not found.' });
      }
  
      // Group photos URLs into an array
      const place = {
        id: results[0].placeid,
        userid: results[0].userid,
        name: results[0].name,
        classification: results[0].classification,
        region: results[0].region,
        city: results[0].city,
        service: {
          id: results[0].serviceid,
          name: results[0].service_name,
        },
        location: results[0].location,
        photo_urls: results.filter(row => row.photo_url).map(row => row.photo_url),
      };
  
      console.log('Place fetched by ID successfully.');
      return res.status(200).json({ place });
    } catch (error) {
      console.error('Error fetching place by ID: ' + error);
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
  