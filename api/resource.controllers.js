const { db } = require("../db");
const { verifyToken } = require("../middlewares/auth.middlewares");
const { ApiError } = require("../utils/ApiError");
const { errorHandler } = require("../utils/errorHandler");
const { responseHandler } = require("../utils/responseHandler");
const profiles = db.collection("profiles");

/*
 * Resource APIs,
 *
 * These controller are here to let clients access user's resources
 * All of these Resource-specific APIs expect a valid access_token
 * Upon parsing permissions are extracted and response is returned
 * based on what is permitted.
 */

async function getUserDetails(req, res) {
  /*
   * Endpoint that agents use to query user details
   * Expects a valid access_token
   */
  try {
    // Guard rail
    if (req.method !== "GET") {
      throw new ApiError(405, "Method not allowed");
    }

    // Verify access token
    const { permissions, username } = await verifyToken(req);

    // Check permissions
    if (!permissions.includes("READ")) {
      throw new ApiError(403, "Access denied");
    }

    console.log(permissions, username);
    // Query database
    const user = await profiles.findOne({ username });

    // Respond with allowed data
    return responseHandler(
      res,
      200,
      {
        name: user.name,
        email: user.email,
        username: user.username,
      },
      "Requested data!"
    );
  } catch (error) {
    console.log(error.message);
    error instanceof ApiError
      ? errorHandler(res, error.statusCode, error.message)
      : errorHandler(res);
  }
}

module.exports = {
  getUserDetails,
};
