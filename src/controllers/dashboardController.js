import User from "../models/User.js";
import License from "../models/License.js";
import Coupon from "../models/Coupon.js";
import OfferCard from "../models/OfferCard.js";
import PaymentRecord from "../models/PaymentRecord.js";

export const getDashboardSummary = async (req, res) => {
  const [
    totalUsers,
    activeLicenses,
    totalCoupons,
    totalOffers,
    recentUsers,
    recentPayments
  ] = await Promise.all([
    User.countDocuments(),
    License.countDocuments({ status: "active" }),
    Coupon.countDocuments(),
    OfferCard.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(5).select("fullName email plan status createdAt"),
    PaymentRecord.find().sort({ createdAt: -1 }).limit(5)
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
        totalRevenue: revenueAgg[0]?.totalRevenue || 0
      },
      recentUsers,
      recentPayments
    }
  });
};
