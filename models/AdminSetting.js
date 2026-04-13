const mongoose = require('mongoose');

const AdminSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    category: { type: String, default: 'general', trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.models.AdminSetting || mongoose.model('AdminSetting', AdminSettingSchema);
