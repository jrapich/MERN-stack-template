const jwt = require("jsonwebtoken");
const { DevLoggingTools } = require("./dev");
const dev = new DevLoggingTools(false);
const secret = process.env.JWT_SECRET;
const expiration = process.env.TOKEN_EXPIRATION;

class AuthTools {
  middleware({ req }) {
    let token = req.body.token || req.query.token || req.headers.authorization;
    //by default, format of token should be "Bearer <token here>"
    //can change this on front end if desired
    //pop the token out of the string
    if (req.headers.authorization) {
      token = token.split(" ").pop().trim();
    }

    //parse any token data in the req, and set it to req.user
    try {
      const { data } = jwt.verify(token, secret, { maxAge: expiration });
      req.user = data;
    } catch (err) {
      dev.log("invalid token received", true);
      dev.groupError("invalid token data"[(err, data, token)]);
    } finally {
      return req;
    }
  }
  //sign the user data into a token
  signToken({ email, username, _id }) {
    const payload = { email: email, username: username, _id: _id };
    return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
  }
}

module.exports = {
  AuthTools,
};
