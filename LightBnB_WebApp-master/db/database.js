const { Pool } = require("pg");
const pool = new Pool({
  user: "labber",
  password: "123",
  host: "localhost",
  database: "lightbnb",
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const queryString = `SELECT * FROM users WHERE email = $1`;
  const values = [email];
  return pool
    .query(queryString, values)
    .then((res) => {
      if (res.rows.length !== 0) {
        return res.rows[0];
      }
      return null;
    })
    .catch((err) => {
      //throw err;
      console.log(err);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const queryString = `SELECT * FROM users WHERE id = $1`;
  const values = [id];
  return pool
    .query(queryString, values)
    .then((res) => {
      if (res.rows.length !== 0) {
        return res.rows[0];
      }
      return null;
    })
    .catch((err) => {
      console.log(err);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const { name, email, password } = user;
  const queryString = `INSERT INTO users(name, email, password) VALUES($1,$2,$3) RETURNING *`;
  const values = [name, email, password];
  return pool
    .query(queryString, values)
    .then((res) => {
      return res.rows[0];
    })
    .catch((err) => {
      console.log(err);
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const queryString = `SELECT reservations.*, properties.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2`;
  const values = [guest_id, limit];
  return pool
    .query(queryString, values)
    .then((res) => {
      return res.rows;
    })
    .catch((err) => {
      console.log(err);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  console.log(options);
  const queryParams = [];
  let queryString = `SELECT properties.*, avg(property_reviews.rating) as average_rating FROM properties JOIN property_reviews ON properties.id = property_id`;

  if (options.owner_id) {
    queryParams.push(Number(options.owner_id));
    queryString += ` WHERE properties.owner_id =  $${queryParams.length}`;
  }
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` WHERE city LIKE $${queryParams.length}`;
  }
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night) * 100);
    queryParams.push(Number(options.maximum_price_per_night) * 100);
    queryString += ` AND cost_per_night BETWEEN $${
      queryParams.length - 1
    } AND $${queryParams.length}`;
  } else if (options.minimum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night) * 100);
    queryString += ` AND cost_per_night > $${queryParams.length}`;
  } else if (options.maximum_price_per_night) {
    queryParams.push(Number(options.maximum_price_per_night) * 100);
    queryString += ` AND cost_per_night < $${queryParams.length}`;
  }

  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    queryString += ` GROUP BY properties.id HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
    queryParams.push(limit);
    queryString += ` ORDER BY cost_per_night LIMIT $${queryParams.length}`;
    return pool
      .query(queryString, queryParams)
      .then((res) => {
        return res.rows;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  queryParams.push(limit);
  queryString += ` GROUP BY properties.id ORDER BY cost_per_night LIMIT $${queryParams.length}`;

  return pool
    .query(queryString, queryParams)
    .then((res) => {
      return res.rows;
    })
    .catch((err) => {
      console.log(err);
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const {
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms,
    country,
    street,
    city,
    province,
    post_code,
  } = property;
  const values = [
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night * 100,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms,
    country,
    street,
    city,
    province,
    post_code,
  ];
  console.log(values);
  const queryString = `INSERT INTO properties(owner_id,title,description,thumbnail_photo_url,cover_photo_url,cost_per_night,parking_spaces,number_of_bathrooms,number_of_bedrooms, country,street,city,province, post_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`;
  return pool
    .query(queryString, values)
    .then((res) => {
      return res.rows[0];
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
