SBU V14 BACKEND PATCH

1) Add model:
- src/models/PasswordResetToken.js

2) In src/services/emailService.js add export:
- sendPasswordResetEmail (see emailService.v14.patch.js)

3) In src/controllers/authController.js:
Add imports:
- crypto
- PasswordResetToken
- sendPasswordResetEmail

Add methods:
- requestPasswordReset
- resetPassword
(from authController.v14.patch.js)

4) In src/routes/authRoutes.js add:
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

5) Ensure FRONTEND_URL env var is correct:
https://sembhibotultimate.com\n