const http = require("http");
const url = require("url");
const { signMyJWT } = require("./myOwnJWT");
const { ApiError } = require("./utils/ApiError");
const { responseHandler } = require("./utils/responseHandler");
const { errorHandler } = require("./utils/errorHandler");
const { comparePasswords } = require("./utils/bcryptEquivalent");

// Router
const router = {
  "/api/authenticate": authenticate,
  "/api/register": register,
};

// Create HTTP server
const server = http.createServer((req, res) => {
  const reqUrl = url.parse(req.url, true);
  const path = reqUrl.pathname;
  const handler = router[path] || null;
  const queryParams = reqUrl.query;

  if (handler == null) {
    res.statusCode = 404;
    errorHandler(res, 404, "Not found");
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const data = JSON.parse(body);
      await handler(req, res, data, queryParams); // Run main function
      /*
       *
       */
    } catch (error) {
      // Handle caught errors
      error instanceof ApiError
        ? errorHandler(res, error.statusCode, error.message)
        : errorHandler(res);
    }
  });
});

// Endpoints
async function authenticate(req, res, data, queryParams) {
  /*
   * Endpoint for user authentication
   */

  // Guard Rail
  if (req.method !== "POST") {
    throw new ApiError(405, "Method not allowed!");
  }

  const { username, password } = data;
  const { agentId } = queryParams || null;

  // Return if request doesn't contain username & password
  if (!username || !password) {
    throw new ApiError(401, "Both username & password are required!");
  }

  /*
   * Carry out main processing
   *
   */
  const userProfile = await db.profiles.findOne({ email });

  // Check if the user exists
  if (!userProfile) {
    throw new ApiError(
      404,
      "Profile not found, kindly register before logging in!"
    );
  }

  // Custom bcrypt.compare equivalent function
  const isPasswordCorrect = await comparePasswords(
    receivedPassword,
    userProfile.password
  );

  if (!isPasswordCorrect) {
    throw new ApiError(404, "Incorrect Email or password!");
  }

  // Extract Permissions
  const agentPermissions = userProfile.agents.filter(
    (agent) => agent._id === agentId
  );

  const access_token = signMyJWT(agentPermissions, "useDotEnvHere");
  return responseHandler(res, 200, { access_token });
  /*
   *
   *
   */
}

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
