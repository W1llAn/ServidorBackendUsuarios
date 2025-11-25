const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const OAuthController = require("../controllers/oauthController");
const { verifyToken } = require("../middlewares/authMiddleware");

// GET - Iniciar autenticación con Google
// Ruta: /api/auth/google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// GET - Callback de Google después de autenticación
// Ruta: /api/auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/login?error=oauth_failed`
      : "/login?error=oauth_failed",
  }),
  OAuthController.googleCallback
);

// GET - Obtener cuentas OAuth vinculadas (requiere autenticación)
// Ruta: /api/auth/oauth/accounts
router.get("/oauth/accounts", verifyToken, OAuthController.getLinkedAccounts);

// DELETE - Desvincular cuenta OAuth (requiere autenticación)
// Ruta: /api/auth/oauth/unlink/:provider
router.delete(
  "/oauth/unlink/:provider",
  verifyToken,
  OAuthController.unlinkAccount
);

module.exports = router;
