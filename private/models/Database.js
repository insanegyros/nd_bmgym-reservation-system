var path = require('path');
const settings = require(path.resolve('./src', 'settings'))

module.exports = require('knex')({
  client: 'mysql2',
  debug: false,
  connection: settings.database
});
