import User from "../models/User.js";
import License from "../models/License.js";
import Coupon from "../models/Coupon.js";
import OfferCard from "../models/OfferCard.js";
import PaymentRecord from "../models/PaymentRecord.js";
import LegalDocument from "../models/LegalDocument.js";

function startOfDay(d=new Date()){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function daysAgo(n){ const d = startOfDay(new Date()); d.setDate(d.getDate()-n); return d; }

export async function getDashboardSummary(req, res) {
  const today = startOfDay();
  const weekStart = daysAgo(6);
  const monthStart = daysAgo(29);

  const [
    totalUsers, activeLicenses, totalCoupons, totalOffers, legalDocs,
    activeUsers, inactiveUsers, disabledUsers,
    recentUsers, recentPayments,
    todayUsers, weeklyUsers, monthlyUsers
  ] = await Promise.all([
    User.countDocuments(),
    License.countDocuments({ status: "active" }),
    Coupon.countDocuments(),
    OfferCard.countDocuments(),
    LegalDocument.countDocuments(),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ status: "inactive" }),
    User.countDocuments({ status: "disabled" }),
    User.find().sort({ createdAt: -1 }).limit(8).select("fullName email status plan createdAt"),
    PaymentRecord.find().sort({ createdAt: -1 }).limit(8).select("customerEmail amount paymentStatus createdAt"),
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ createdAt: { $gte: weekStart } }),
    User.countDocuments({ createdAt: { $gte: monthStart } })
  ]);

  const [totalRevenueAgg, todayRevenueAgg, weeklyRevenueAgg, monthlyRevenueAgg] = await Promise.all([
    PaymentRecord.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    PaymentRecord.aggregate([{ $match: { paymentStatus: "paid", createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    PaymentRecord.aggregate([{ $match: { paymentStatus: "paid", createdAt: { $gte: weekStart } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    PaymentRecord.aggregate([{ $match: { paymentStatus: "paid", createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
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
        totalRevenue: totalRevenueAgg[0]?.total || 0,
        todayRevenue: todayRevenueAgg[0]?.total || 0,
        weeklyRevenue: weeklyRevenueAgg[0]?.total || 0,
        monthlyRevenue: monthlyRevenueAgg[0]?.total || 0,
        activeUsers,
        inactiveUsers,
        disabledUsers,
        todayUsers,
        weeklyUsers,
        monthlyUsers
      },
      recentUsers,
      recentPayments
    }
  });
}
