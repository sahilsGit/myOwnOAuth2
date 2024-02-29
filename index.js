const http = require("http");
const url = require("url");
const { ApiError } = require("./utils/ApiError.js");
const { errorHandler } = require("./utils/errorHandler.js");
const { connect, db } = require("./db");
const { registerAgent, loginAgent } = require("./api/agent.controllers.js");
const { registerUser, loginUser } = require("./api/user.controllers.js");
const {
  createSession,
  authenticateSession,
  changeSessionPermissions,
} = require("./api/session.controllers.js");

// Connect to mongoDb
(async () => {
  await connect();
})();

// Router
const router = {
  "/api/session/create": createSession,
  "/api/session/authenticate": authenticateSession,
  "/api/session/changePermissions": changeSessionPermissions,
  "/api/user/register": registerUser,
  "/api/user/login": loginUser,
  "/api/agent/register": registerAgent,
  "/api/agent/login": loginAgent,
};

// Create HTTP server
const server = http.createServer((req, res) => {
  /*
   *
   *
   *
   * Main Server Instance that handles requests
   */

  try {
    const path = url.parse(req.url, true).pathname;
    const handler = router[path] || null;

    // A null handler means a wrong endpoint has been hit
    if (handler == null) {
      throw new ApiError(404, "Not found!");
    }

    // To hold body chucks
    let body = "";

    // Extract the body chuck
    req.on("data", (chunk) => {
      body += chunk;
    });

    // Main controller logic
    req.on("end", async () => {
      let data; // To accommodate data sent with body

      // Body is allowed only when the method is "POST" or "PUT"
      if (req.method === "POST" || req.method === "PUT") {
        data = JSON.parse(body); // populate the data
      }

      // Call main controller with req, res and body
      await handler(req, res, data);
    });
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

// Start server
server.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}/`);
});
