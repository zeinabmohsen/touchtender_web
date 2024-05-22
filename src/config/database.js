const mysql = require('mysql');

// Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: 'bhvwiuygne0lombuil4m-mysql.services.clever-cloud.com',
  user: 'umbl4z0odoxkihg0',
  password: '7y5HrObO2HzHvTRwmY8P',
  database: 'bhvwiuygne0lombuil4m',
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database'); 
});



module.exports = connection;

