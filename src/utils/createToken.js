import jwt from "jsonwebtoken";

export function createToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      fullName: user.fullName
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}
