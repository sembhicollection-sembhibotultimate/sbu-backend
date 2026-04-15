import User from "../models/User.js";
import License from "../models/License.js";
import Coupon from "../models/Coupon.js";
import OfferCard from "../models/OfferCard.js";
import PaymentRecord from "../models/PaymentRecord.js";
import LegalDocument from "../models/LegalDocument.js";

export async function getDashboardSummary(req, res) {
  const [totalUsers, activeLicenses, totalCoupons, totalOffers, legalDocs, recentUsers, recentPayments, activeUsers, inactiveUsers] = await Promise.all([
    User.countDocuments(),
    License.countDocuments({ status: "active" }),
    Coupon.countDocuments(),
    OfferCard.countDocuments(),
    LegalDocument.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(5).select("fullName email status plan createdAt"),
    PaymentRecord.find().sort({ createdAt: -1 }).limit(5).select("customerEmail amount paymentStatus createdAt"),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ status: { $ne: "active" } })
  ]);

  const revenueAgg = await PaymentRecord.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        activeLicenses,
        totalCoupons,
        totalOffers,
        totalLegalDocs: legalDocs,
        totalRevenue: revenueAgg[0]?.totalRevenue || 0,
        activeUsers,
        inactiveUsers
      },
      recentUsers,
      recentPayments
    }
  });
}
