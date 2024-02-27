const http = require("http");
const url = require("url");
const { signMyJWT } = require("./utils/jwtEquivalent.js");
const { ApiError } = require("./utils/ApiError.js");
const { responseHandler } = require("./utils/responseHandler.js");
const { errorHandler } = require("./utils/errorHandler.js");
const {
  comparePasswords,
  generateHash,
} = require("./utils/bcryptEquivalent.js");
const { connect, db } = require("./db");

const profiles = db.collection("profiles");

(async () => {
  await connect();
})(); // connect to mongoDb

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
      console.log(error.message);
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

  const userProfile = await profiles.findOne({ username });

  // Check if the user exists
  if (!userProfile) {
    throw new ApiError(
      404,
      "Profile not found, kindly register before logging in!"
    );
  }

  // Custom bcrypt.compare equivalent function
  const isPasswordCorrect = await comparePasswords(
    password,
    userProfile.password
  );

  if (!isPasswordCorrect) {
    throw new ApiError(404, "Incorrect Email or password!");
  }

  // Extract Permissions
  const agent = userProfile.agents.find(
    (agent) => agent._id.toHexString() === agentId
  );

  const access_token = signMyJWT(agent.permissions, process.env.JWT);
  return responseHandler(
    res,
    200,
    { access_token },
    "Successfully created access_token!"
  );
  /*
   *
   *
   */
}

async function register(req, res, data, queryParams) {
  /*
   *
   * Endpoint for user registration
   *
   */

  // Guard Rail
  if (req.method !== "POST") {
    throw new ApiError(405, "Method not allowed!");
  }

  // Return if request doesn't contain required data
  const { username, name, password, email } = data;

  if (!username || !name || !email || !password) {
    throw new ApiError(409, "Some data's missing!");
  }

  /*
   * Carry out main processing
   *
   */

  // Check if user already exists
  const existingProfile = await profiles.findOne({ email });

  if (existingProfile) {
    throw new ApiError(409, "Already registered, consider signing in!");
  }

  const hashedPassword = await generateHash(password);

  const newProfile = {
    username,
    name,
    email,
    password: hashedPassword,
  };

  // Save it in the database
  profiles.insertOne(newProfile);

  return responseHandler(res, 200);
}

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
