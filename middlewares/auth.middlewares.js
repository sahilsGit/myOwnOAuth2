const { ApiError } = require("../utils/ApiError");
const { errorHandler } = require("../utils/errorHandler");
const { verifyMyJWT } = require("../utils/jwtEquivalent");

async function verifyToken(req) {
  try {
    // Extract the authHeader
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      throw new ApiError(401, "Login_token is required!");
    }

    // Extract the access_token out of the auth header
    const login_token = authHeader.split(" ")[1];

    // Verify access_token
    const decoded = verifyMyJWT(login_token, process.env.JWT);

    // Return payload
    return decoded;
  } catch (error) {
    // Handle caught errors
    error instanceof ApiError
      ? errorHandler(res, error.statusCode, error.message)
      : errorHandler(res);
  }
}

module.exports = { verifyToken };
