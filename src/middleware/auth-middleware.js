const jwt = require('jsonwebtoken');

const config = require('../config');

const authMiddleWare = (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: 'Failed to authenticate token' });
      }
      req.userData = decoded.data;
      next();
      return decoded;
    });
    return token;
  }
  return res.status(401).send({
    success: false,
    message: 'No token provided.',
  });
};

module.exports = authMiddleWare;
