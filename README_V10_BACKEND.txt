SBU V10 BACKEND

Replace these files in your backend:
- src/server.js
- src/routes/adminRoutes.js
- src/routes/memberPortalRoutes.js
- src/controllers/adminUserController.js
- src/controllers/memberPortalController.js
- src/services/emailService.js
- src/models/SupportMessage.js
- src/models/DownloadItem.js
- src/models/LearningVideo.js

After deploy, seed portal resources once:
POST /api/member/portal/seed-resources

Notes:
- Admin users page now supports user detail, agreement, licenses, single/bulk email, and member messages.
- Portal now supports downloads, videos, member messages.
- Create License button now works with /api/admin/users/:id/license
