const crypto = require("crypto");

async function generateHash(
  password,
  salt = crypto.randomBytes(16).toString("hex"),
  iterations = 100000
) {
  /*
   *
   * Generates a crypto safe hash from a given string
   * Takes in optional salt and iterations
   *
   */

  // Promise to handle asynchronous generation of the hash
  const generationPromise = new Promise((resolve, reject) => {
    // Use crypto.pbkdf2 to generate a hash asynchronously
    crypto.pbkdf2(
      password, // Input password
      salt, // Salt used for hashing
      iterations, // Number of iterations
      64, // Length of the derived key (in bytes)
      "sha512", // Hashing algorithm (SHA-512)

      // Callback function to handle the result
      (error, derivedKey) => {
        if (error) {
          reject(error);
        } else {
          // Resolve the Promise with the derived key + salt

          // Attaching salt like this at the end defeats the purpose of salting it in the first place as attackers can easily extract it out. Doing this if fine for now as I am not in production, but for production I will have to do some extra processing.

          resolve(derivedKey.toString("hex") + salt);
        }
      }
    );
  });

  // Await the resolution of the Promise and return the result hashed password
  return await generationPromise;
}

// Asynchronous function to compare entered password with hashed password
async function comparePasswords(enteredPassword, hashedPassword) {
  /*
   *
   * Compares Entered password with hashed password
   * Asynchronously
   *
   */
  const salt = hashedPassword.slice(128);

  // Hash the entered password using the extracted salt
  const hashedEnteredPassword = await generateHash(enteredPassword, salt);

  // Security consideration: All passwords in production must be deciphered in constant time (irrespective of how correct or how incorrect they are) to prevent the attacker from time-attacking a password.

  // Perform a constant-time comparison of hashed passwords using timingSafeEqual
  const passwordsMatch = crypto.timingSafeEqual(
    Buffer.from(hashedEnteredPassword, "hex"), // Convert hashed entered password to buffer
    Buffer.from(hashedPassword, "hex") // Convert hashed password to buffer
  );

  // Return true if passwords match, false otherwise
  return passwordsMatch;
}

module.exports = { generateHash, comparePasswords };
