const app = require('../app');

// Export as a serverless function
module.exports = (req, res) => {
  app(req, res);
};