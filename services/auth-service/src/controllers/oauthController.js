const jwt = require("jsonwebtoken");
const pool = require("../config/database");

class OAuthController {
  // GET - Iniciar autenticación con Google
  // Esta ruta redirige al usuario a Google
  static googleAuth(req, res, next) {
    // Passport maneja la redirección automáticamente
    // El callback está en las rutas
  }

  // GET - Callback de Google después de autenticación
  static async googleCallback(req, res) {
    try {
      // Si llegamos aquí, Passport ya autenticó al usuario
      const user = req.user;

      if (!user) {
        // Error en la autenticación
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login?error=oauth_failed`
        );
      }

      // Generar tokens JWT
      const accessToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          rol: user.rol,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      // Guardar refresh token en la BD
      await pool.query(
        "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)",
        [user.id, refreshToken]
      );

      // Redirigir al frontend con los tokens
      // En producción, usa una forma más segura de pasar los tokens
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const redirectUrl = `${frontendUrl}?access_token=${accessToken}&refresh_token=${refreshToken}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Error en OAuth callback:", error);
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?error=server_error`
      );
    }
  }

  // GET - Obtener información de cuentas OAuth vinculadas del usuario autenticado
  static async getLinkedAccounts(req, res) {
    try {
      const userId = req.user.id;

      const result = await pool.query(
        `SELECT id, provider, email, display_name, profile_photo, created_at
         FROM oauth_accounts
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error("Error al obtener cuentas OAuth:", error);
      res.status(500).json({
        success: false,
        error: "Error al obtener cuentas vinculadas",
        message: error.message,
      });
    }
  }

  // DELETE - Desvincular cuenta OAuth
  static async unlinkAccount(req, res) {
    try {
      const userId = req.user.id;
      const { provider } = req.params;

      // Verificar que el usuario tiene otra forma de autenticación
      const userResult = await pool.query(
        "SELECT auth_type, password FROM usuarios WHERE id = $1",
        [userId]
      );

      const user = userResult.rows[0];

      // Contar cuántas cuentas OAuth tiene el usuario
      const oauthCountResult = await pool.query(
        "SELECT COUNT(*) as count FROM oauth_accounts WHERE user_id = $1",
        [userId]
      );

      const oauthCount = parseInt(oauthCountResult.rows[0].count);

      // Si es la única cuenta OAuth y no tiene password, no puede desvincular
      if (oauthCount === 1 && !user.password) {
        return res.status(400).json({
          success: false,
          error:
            "No puedes desvincular tu única forma de autenticación. Establece una contraseña primero.",
        });
      }

      // Eliminar la cuenta OAuth
      const deleteResult = await pool.query(
        "DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2 RETURNING id",
        [userId, provider]
      );

      if (deleteResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Cuenta OAuth no encontrada",
        });
      }

      // Actualizar auth_type del usuario si es necesario
      if (oauthCount === 1 && user.password) {
        // Ya no tiene cuentas OAuth, solo password
        await pool.query("UPDATE usuarios SET auth_type = $1 WHERE id = $2", [
          "local",
          userId,
        ]);
      }

      res.json({
        success: true,
        message: `Cuenta de ${provider} desvinculada exitosamente`,
      });
    } catch (error) {
      console.error("Error al desvincular cuenta OAuth:", error);
      res.status(500).json({
        success: false,
        error: "Error al desvincular cuenta",
        message: error.message,
      });
    }
  }
}

module.exports = OAuthController;
