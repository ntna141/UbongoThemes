const { server } = require('./app');
const port = process.env.PORT || 5001;

server.listen(port,'::', () => {
  console.log(`Server is running on port ${port}`);
});