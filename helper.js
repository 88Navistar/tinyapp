const urlsForUser = function(database, id) {
  const filter = {};
  for (const url in database) {

    if (id === database[url].userID) {
      filter[url] = database[url];
    }
  }
  return filter;
};

const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return false;
};

const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};

module.exports = {urlsForUser, getUserByEmail, generateRandomString};