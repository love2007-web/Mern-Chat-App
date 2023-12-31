const jwt = require("jsonwebtoken");
const {User} = require("../models/user.model");


const protect = async (req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      //decodes token id
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
      req.user = await User.findOne({email}).select("-password");

      next();
    } catch (error) {
        console.log(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
};

module.exports = { protect };
