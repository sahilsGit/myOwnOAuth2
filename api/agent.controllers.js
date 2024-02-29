const { db } = require("../db");
const { ApiError } = require("../utils/ApiError");
const { generateHash, comparePasswords } = require("../utils/bcryptEquivalent");
const { errorHandler } = require("../utils/errorHandler");
const { signMyJWT } = require("../utils/jwtEquivalent");
const { responseHandler } = require("../utils/responseHandler");
const agents = db.collection("agents");
const { randomBytes } = require("crypto");

/*
 * Agent Specific APIs,
 *
 * Agents are parties/services that gain access
 * to users account using the temporary access_token.
 *
 * Users as the owners of their accounts
 * Authenticate => Permit => Allow account access to these agents
 * via access_tokens
 *
 *
 * Agents must register themselves with the system, which grants
 * them an "agentUiD", that is used to manage the OAuth equivalent session.
 */

async function registerAgent(req, res, data) {
  /*
   *
   * Endpoint for agent registration
   */

  // Guard Rail
  if (req.method !== "POST") {
    throw new ApiError(405, "Method not allowed!");
  }

  try {
    const { agentName, password } = data;

    // Throw error if required data is missing
    if (!agentName || !password) {
      throw new ApiError(409, "Please provide agent agentName and password!");
    }

    // Check if user's already registered
    const existingProfile = await agents.findOne({ agentName });

    // Check if user already exists
    if (existingProfile) {
      throw new ApiError(409, "Already registered, consider signing in!");
    }

    // Hash the password with my custom bcryptJs's bcrypt.hash() equivalent function
    const hashedPassword = await generateHash(password);

    // Generate a unique agent UID (replace this with your preferred UID generation method)
    const agentUid = randomBytes(16).toString("hex").slice(0, 32);

    // Prepare agent data
    const newAgent = {
      agentName,
      password: hashedPassword,
      agentUid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into db (assuming a separate collection for agents)
    await agents.insertOne(newAgent);

    // Return response
    return responseHandler(res, 200, { agentUid }, "Agent Signup Successful!");
  } catch (error) {
    // Handle caught errors
    error instanceof ApiError
      ? errorHandler(res, error.statusCode, error.message)
      : errorHandler(res);
  }
}

async function loginAgent(req, res, data) {
  /*
   *
   *
   * Endpoint for agent login
   */

  // Guard Rail
  if (req.method !== "POST") {
    throw new ApiError(405, "Method not allowed!");
  }

  try {
    const { agentName, password } = data;

    // Throw error if required data is missing
    if (!agentName || !password) {
      throw new ApiError(401, "agentName and password are required!");
    }

    // Query DB
    const agent = await agents.findOne({ agentName });

    if (!agent) {
      throw new ApiError(401, "Invalid agent agentName or password!");
    }

    // Custom bcrypt.compare equivalent function
    const isPasswordCorrect = await comparePasswords(password, agent.password);

    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid agent agentName or password!");
    }

    // Sign my custom-made JWT equivalent token
    const access_token = signMyJWT(
      { agentName: agent.agentName },
      process.env.JWT
    );

    // Return response
    return responseHandler(
      res,
      200,
      { access_token },
      "Agent Login Successful!"
    );
  } catch (error) {
    // Handle caught errors
    error instanceof ApiError
      ? errorHandler(res, error.statusCode, error.message)
      : errorHandler(res);
  }
}

module.exports = { registerAgent, loginAgent };
