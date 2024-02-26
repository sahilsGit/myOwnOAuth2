const { createHmac } = require("node:crypto");

function signMyJWT(payload, secret, options = { alg: "sha256", typ: "MyJWT" }) {
  /*
   *
   * Takes payload, secret and options
   * Returns JWT equivalent Token
   *
   */

  options.expireAt = options.expireAt || Math.floor(Date.now() / 1000) + 5 * 60; // If expireAt is not given then make it 5 minutes by default

  // Stringify header so that Buffer accepts it
  const stringifiedHeader = JSON.stringify({
    alg: options.alg,
    typ: options.typ,
  });

  // Stringify payload so that Buffer accepts it
  const stringifiedPayload = JSON.stringify({
    ...payload,
    expireAt: options.expireAt,
  });

  // Encode to base64Url
  const encodedHeader = Buffer.from(stringifiedHeader, "utf8").toString(
    "base64url"
  );

  // Encode to base64Url
  const encodedPayload = Buffer.from(stringifiedPayload, "utf8").toString(
    "base64url"
  );

  // Sign the header and payload with secret using SHA256
  const signature = createHmac("sha256", secret)
    .update(encodedHeader)
    .update(encodedPayload)
    .digest("hex");

  // return final JWT
  return encodedHeader + "." + encodedPayload + "." + signature;
}

function verifyMyJWT(token, secret) {
  /*
   *
   * Takes the JWT equivalent token & Secret
   * Returns decoded payload or an error if token's invalid
   *
   */

  // Check if the token is in the correct format with 3 parts
  if (!token.includes(".")) {
    throw new Error("Invalid JWT format. Missing parts.");
  }

  // Split the token into header, payload, and signature
  const [encodedHeader, encodedPayload, signature] = token.split(".");

  // Validate signature if necessary (depending on security requirements)
  if (signature) {
    // Decode header and payload
    const header = JSON.parse(
      Buffer.from(encodedHeader, "base64url").toString("utf8")
    );

    // Calculate expected signature and compare
    const expectedSignature = createHmac(header.alg, secret)
      .update(encodedHeader)
      .update(encodedPayload)
      .digest("hex");

    if (signature !== expectedSignature) {
      throw new Error(
        "Invalid JWT signature. Token tampered with or invalid secret."
      );
    }
  }

  // Decode payload and check expireAt
  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8")
  );

  // Check if expireAt is present and valid
  if (payload.expireAt && payload.expireAt < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired!");
  }

  const { expireAt, ...data } = payload; // Filter expireAt out of the payload
  return data;
}

module.exports = { signMyJWT, verifyMyJWT };
