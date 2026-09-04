const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Support lookup by decoded.id or legacy decoded.email
      const query = decoded.id ? { _id: decoded.id } : { email: decoded.email };
      req.user = await User.findOne(query).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "User not found with this token" });
      }

      next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Not authorized, token invalid or expired" });
    }
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }
};

module.exports = { protect };
