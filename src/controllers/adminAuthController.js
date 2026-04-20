import { randomBytes } from "crypto";

export async function adminLogin(req, res) {
  const email = (req.body.email || "").toLowerCase().trim();
  const password = req.body.password || "";

  const validEmail = !process.env.ADMIN_EMAIL || email === String(process.env.ADMIN_EMAIL).toLowerCase().trim();
  const validPassword = password && password === process.env.ADMIN_API_KEY;

  if (!validEmail || !validPassword) {
    return res.status(401).json({ success: false, message: "Invalid admin credentials" });
  }

  const token = randomBytes(24).toString("hex");
  return res.json({
    success: true,
    message: "Admin login successful",
    data: {
      token,
      adminEmail: process.env.ADMIN_EMAIL || "admin"
    }
  });
}
