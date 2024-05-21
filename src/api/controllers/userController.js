const connection = require("../../config/database");
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: 'uploads/users',
    filename: (req, file, cb) => {
      const ext = file.mimetype.split('/')[1];
      const filename = `user-${uuidv4()}-${Date.now()}.${ext}`;
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
  
  exports.uploadImage = multer({ storage, fileFilter }).single('user_image');