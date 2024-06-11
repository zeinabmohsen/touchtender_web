const mysql = require('mysql');


const connection = mysql.createConnection({
  host: 'bhvwiuygne0lombuil4m-mysql.services.clever-cloud.com',
  user: 'umbl4z0odoxkihg0',
  password: '7y5HrObO2HzHvTRwmY8P',
  database: 'bhvwiuygne0lombuil4m',
});

// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'tendertouch',
// });


connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database'); 
});



module.exports = connection;

