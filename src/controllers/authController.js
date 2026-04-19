import bcrypt from "bcryptjs";
import User from "../models/User.js";
import License from "../models/License.js";
import LegalDocument from "../models/LegalDocument.js";
import { createToken } from "../utils/createToken.js";
import { buildAgreementPdfBuffer } from "../utils/pdfAgreement.js";
import { sendAgreementPdfEmail } from "../services/emailService.js";
import { generateLicenseKey } from "../utils/generateLicenseKey.js";

function requiredAcceptance(body) {
  return [body.termsAccepted, body.privacyAccepted, body.refundAccepted, body.riskAccepted].every(Boolean);
}

export async function register(req, res) {
  const {
    fullName, email, password, phone, address, country,
    plan = "monthly", couponCode = "",
    termsAccepted, privacyAccepted, refundAccepted, riskAccepted,
    signatureDataUrl = "", signatureTypedName = ""
  } = req.body || {};

  if (!fullName || !email || !password || !phone || !address) {
    return res.status(400).json({ success: false, message: "Name, email, password, phone, and address are required" });
  }
  if (!requiredAcceptance(req.body)) {
    return res.status(400).json({ success: false, message: "All legal conditions must be accepted before signup" });
  }
  if (!signatureDataUrl && !signatureTypedName) {
    return res.status(400).json({ success: false, message: "Digital signature is required" });
  }

  const cleanEmail = email.toLowerCase().trim();
  const exists = await User.findOne({ email: cleanEmail });

  if (exists) {
    const ok = await bcrypt.compare(password || "", exists.passwordHash);
    if (!ok) {
      return res.status(400).json({ success: false, message: "Email already registered. Use the same password or login." });
    }

    exists.fullName = fullName;
    exists.phone = phone;
    exists.address = address;
    exists.country = country;
    exists.plan = plan;
    exists.couponUsed = couponCode?.trim()?.toUpperCase() || exists.couponUsed || "";
    exists.acceptance = {
      termsAccepted,
      privacyAccepted,
      refundAccepted,
      riskAccepted,
      signatureDataUrl,
      signatureTypedName,
      acceptedAt: new Date(),
      ipAddress: req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket?.remoteAddress || "",
      userAgent: req.headers["user-agent"] || ""
    };
    await exists.save();

    let license = await License.findOne({ userId: exists._id }).sort({ createdAt: -1 });
    if (!license) {
      license = await License.create({
        userId: exists._id,
        licenseKey: generateLicenseKey(),
        plan,
        status: "inactive"
      });
    }

    const token = createToken(exists);
    return res.json({
      success: true,
      existingUser: true,
      message: "Email already registered. Continuing to checkout.",
      token,
      data: {
        user: {
          _id: exists._id,
          fullName: exists.fullName,
          email: exists.email,
          plan: exists.plan,
          avatarUrl: exists.avatarUrl || ""
        },
        license
      }
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email: cleanEmail,
    passwordHash,
    phone,
    address,
    country,
    plan,
    couponUsed: couponCode?.trim()?.toUpperCase() || "",
    acceptance: {
      termsAccepted,
      privacyAccepted,
      refundAccepted,
      riskAccepted,
      signatureDataUrl,
      signatureTypedName,
      acceptedAt: new Date(),
      ipAddress: req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket?.remoteAddress || "",
      userAgent: req.headers["user-agent"] || ""
    }
  });

  const legalDocs = await LegalDocument.find({ slug: { $in: ["privacy", "refund", "risk", "terms"] } }).sort({ slug: 1 });
  try {
    const pdfBuffer = await buildAgreementPdfBuffer({ user, legalDocs });
    await sendAgreementPdfEmail({ user, pdfBuffer });
  } catch (e) {
    console.warn("Agreement PDF/email skipped:", e.message);
  }

  const license = await License.create({
    userId: user._id,
    licenseKey: generateLicenseKey(),
    plan,
    status: "inactive"
  });

  const token = createToken(user);
  res.json({
    success: true,
    message: "Signup completed",
    token,
    data: {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        plan: user.plan,
        avatarUrl: user.avatarUrl || ""
      },
      license
    }
  });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: email?.toLowerCase().trim() });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return res.status(400).json({ success: false, message: "Invalid password" });

  const token = createToken(user);
  res.json({
    success: true,
    token,
    data: {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        plan: user.plan,
        status: user.status,
        avatarUrl: user.avatarUrl || ""
      }
    }
  });
}
