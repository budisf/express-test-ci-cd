process.env.NODE_ENV = 'test';
if (process.env.NODE_ENV === 'testaaa') {
  module.exports = {
    secret: 'TEST_SECRET',
    db_uri: 'mongodb://localhost/Carpool',
    CASValidateURL: 'https://idp.rice.edu/idp/profile/cas/serviceValidate',
    thisServiceURL: 'http://localhost:4200/auth',
    frontendURL: 'http://localhost:4200',
  };
} else {
  module.exports = {
    secret: 'TEST_SECRET',
    //db_uri: 'mongodb://carpool2018:carpool2018@ds147723.mlab.com:47723/carpool-dev1',
    db_uri: 'mongodb://carpool2018:carpool2018@ds149353.mlab.com:49353/carpool_dev', // db_uri: 'mongodb://riceapps:r1ce4pps$wag1@carpool-dev-shard-00-00-k86la.mongodb.net:27017,carpool-dev-shard-00-01-k86la.mongodb.net:27017,carpool-dev-shard-00-02-k86la.mongodb.net:27017/test?ssl=true&replicaSet=carpool-dev-shard-0&authSource=admin',
    CASValidateURL: 'https://idp.rice.edu/idp/profile/cas/serviceValidate',
    //thisServiceURL: 'http://localhost:4200/auth',
    thisServiceURL: 'https://carpool.riceapps.org/auth',
    //frontendURL: 'http://localhost:4200',
    frontendURL: 'https://carpool.riceapps.org',
  };
}
