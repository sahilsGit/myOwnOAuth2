const url = require("url");
const { ApiError } = require("../utils/ApiError");
const { verifyToken } = require("../middlewares/auth.middlewares");
const { db } = require("../db");
const { signMyJWT } = require("../utils/jwtEquivalent");
const { responseHandler } = require("../utils/responseHandler");
const { errorHandler } = require("../utils/errorHandler");
const profiles = db.collection("profiles");

/*
 * Session Specific APIs,
 *
 * By 'Sessions' I mean users authenticating and permitting
 * agents to query the resource server on their behalf by
 * issuing them a temporary access_token
 *
 * These tokens are temporary and are not refreshed automatically -
 * Agents have access only till the current token expires,
 * unless "automatic-refresh" is turned on.
 */

async function createSession(req, res, data) {
  /*
   * Endpoint to create session
   * That is - signing up with an agent for the first time
   */

  try {
    // Extract data & params
    const params = url.parse(req.url, true).query;
    const { agentId } = params;
    const { permissions } = data;

    // Guard Rails
    if (req.method !== "POST") {
      throw new ApiError(405, "Method not allowed!");
    }

    if (!agentId) {
      throw new ApiError(404, "Agent details missing!");
    }

    const alreadyExists = await profiles.findOne({
      agents: {
        $elemMatch: {
          agentId: agentId,
        },
      },
    });

    if (alreadyExists) {
      throw new ApiError(200, "A session already Exists!");
    }

    // Run the verifyToken middleware
    const { username } = await verifyToken(req);

    // Construct the agent object
    const agentObjectToAppend = {
      agentId: agentId,
      permissions: permissions,
    };

    // Update
    await profiles.findOneAndUpdate(
      {
        username: username,
      },
      { $push: { agents: agentObjectToAppend } }
    );

    // Sign my custom-made JWT equivalent token
    const access_token = signMyJWT(
      { permissions: agentObjectToAppend.permissions, username: username },
      process.env.JWT
    );

    // Send response with access_token attached
    return responseHandler(
      res,
      200,
      { access_token },
      "Access_token Successfully Created!"
    );
  } catch (error) {
    // Handle caught errors
    error instanceof ApiError
      ? errorHandler(res, error.statusCode, error.message)
      : errorHandler(res);
  }
  /*
   *
   *
   */
}

async function authenticateSession(req, res) {
  /*
   * Endpoint to re-authenticate,
   * For providing the agent a new temporary access_token
   * Manually.
   */

  // Extract query params
  const params = url.parse(req.url, true).query;
  const { agentId } = params;

  // Guard Rails
  if (req.method !== "GET") {
    throw new ApiError(405, "Method not allowed!");
  }

  if (!agentId) {
    throw new ApiError(404, "Agent details missing!");
  }

  try {
    // Run the verifyToken middleware
    const { username } = await verifyToken(req);

    // Get user profile
    const userProfile = await profiles.findOne({ username });

    // Extract Permissions
    const agent = userProfile.agents.find((agent) => agent.agentId === agentId);

    // Sign my custom-made JWT equivalent token
    const access_token = signMyJWT(
      { permissions: agent.permissions, username: username },
      process.env.JWT
    );

    // Send response with access_token attached
    return responseHandler(
      res,
      200,
      { access_token },
      "Access_token Successfully Created!"
    );
  } catch (error) {
    // Handle caught errors
    error instanceof ApiError
      ? errorHandler(res, error.statusCode, error.message)
      : errorHandler(res);
  }
  /*
   *
   *
   */
}

async function changeSessionPermissions(req, res, data) {
  /*
   * Endpoint for editing agent-permissions
   * This takes effect with the issue of new access_token.
   *
   * Any access_token issued before the permission change will remain
   * valid till it expires, for immediate effect all the old tokens
   * must be invalidated.
   */

  // Extract data & params
  const params = url.parse(req.url, true).query;
  const { agentId } = params;
  const { newPermissions } = data;

  // Guard Rails
  if (req.method !== "POST") {
    throw new ApiError(405, "Method not allowed!");
  }

  if (!agentId) {
    throw new ApiError(404, "Agent details missing!");
  }

  try {
    // Run the verifyToken middleware
    const { username } = await verifyToken(req);

    // Update
    await profiles.findOneAndUpdate(
      { username },
      {
        $set: {
          "agents.$[agent].permissions": newPermissions,
        },
      },
      {
        arrayFilters: [{ "agent.agentId": agentId }],
        returnOriginal: false,
      }
    );

    // Send response with access_token attached
    return responseHandler(res, 200, null, "Changed Permissions Successfully!");
  } catch (error) {
    // Handle caught errors
    error instanceof ApiError
      ? errorHandler(res, error.statusCode, error.message)
      : errorHandler(res);
  }
  /*
   *
   *
   */
}

module.exports = {
  createSession,
  authenticateSession,
  changeSessionPermissions,
};
