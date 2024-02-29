const { db } = require("../db");
const { ApiError } = require("../utils/ApiError");
const { generateHash, comparePasswords } = require("../utils/bcryptEquivalent");
const { errorHandler } = require("../utils/errorHandler");
const { signMyJWT } = require("../utils/jwtEquivalent");
const { responseHandler } = require("../utils/responseHandler");
const profiles = db.collection("profiles");

/*
 * User Specific APIs,
 *
 * By 'Users' I mean individuals or parties that permit the "agents"
 * to query the resource server other their behalf.
 *
 * User's need to register themselves with the centralized auth server
 * Before they can issue the temporary access_token
 */

async function registerUser(req, res, data) {
  /*
   *
   *
   * Endpoint for user registration
   */

  // Guard Rail
  if (req.method !== "POST") {
    throw new ApiError(405, "Method not allowed!");
  }

  try {
    const { username, name, password, email } = data;

    // Return if request doesn't contain required data
    if (!username || !name || !email || !password) {
      throw new ApiError(409, "Some data's missing!");
    }

    // Check if user's already registered
    const existingProfile = await profiles.findOne({ email });

    // Check if user already exists
    if (existingProfile) {
      throw new ApiError(409, "Already registered, consider signing in!");
    }

    // Hash the password with my custom bcryptJs's bcrypt.hash() equivalent function
    const hashedPassword = await generateHash(password);

    // Prepare query data
    const newProfile = {
      username,
      name,
      email,
      password: hashedPassword,
      agents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into db
    profiles.insertOne(newProfile);

    // Sign my custom-made JWT equivalent token
    const access_token = signMyJWT(
      { username: newProfile.username },
      process.env.JWT
    );

    // Return response
    return responseHandler(
      res,
      200,
      { access_token },
      "Registration Successful!"
    );
  } catch (error) {
    // Handle caught errors
    error instanceof ApiError
      ? errorHandler(res, error.statusCode, error.message)
      : errorHandler(res);
  }
}

async function loginUser(req, res, data) {
  /*
   *
   *
   *
   * Endpoint for user authentication
   */

  // Guard Rails
  if (req.method !== "POST") {
    throw new ApiError(405, "Method not allowed!");
  }

  try {
    // Extract username & password
    const { username, password } = data;

    // Throw error if credentials are missing
    if (!username || !password) {
      throw new ApiError(401, "Login credentials are required!");
    }

    // Query DB
    const userProfile = await profiles.findOne({ username });

    // Custom bcrypt.compare equivalent function
    const isPasswordCorrect = await comparePasswords(
      password,
      userProfile.password
    );

    if (!isPasswordCorrect) {
      throw new ApiError(404, "Incorrect Email or password!");
    }

    // Sign my custom-made JWT equivalent token
    const access_token = signMyJWT(
      { username: userProfile.username },
      process.env.JWT
    );

    // Send response with access_token attached
    return responseHandler(res, 200, { access_token }, "Login Successful!");
  } catch (error) {
    // Handle caught errors
    error instanceof ApiError
      ? errorHandler(res, error.statusCode, error.message)
      : errorHandler(res);
  }
}

module.exports = { registerUser, loginUser };
