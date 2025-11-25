const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("./database");

// Configurar la estrategia de Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google OAuth - Profile recibido:", profile.id);

        // Extraer información del perfil de Google
        const googleId = profile.id;
        const email =
          profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const displayName = profile.displayName;
        const profilePhoto =
          profile.photos && profile.photos[0] ? profile.photos[0].value : null;

        if (!email) {
          return done(new Error("No se pudo obtener el email de Google"), null);
        }

        // Buscar si ya existe una cuenta OAuth con este proveedor y ID
        const oauthAccountResult = await pool.query(
          "SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2",
          ["google", googleId]
        );

        let userId;

        if (oauthAccountResult.rows.length > 0) {
          // Usuario ya existe con esta cuenta OAuth
          userId = oauthAccountResult.rows[0].user_id;

          // Actualizar tokens si han cambiado
          await pool.query(
            `UPDATE oauth_accounts 
           SET access_token = $1, refresh_token = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3`,
            [accessToken, refreshToken, oauthAccountResult.rows[0].id]
          );

          console.log("Usuario OAuth existente encontrado:", userId);
        } else {
          // Verificar si existe un usuario con este email
          const userResult = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1",
            [email]
          );

          if (userResult.rows.length > 0) {
            // Usuario existe con ese email, vincular cuenta OAuth
            userId = userResult.rows[0].id;

            // Actualizar auth_type a hybrid si era local
            if (userResult.rows[0].auth_type === "local") {
              await pool.query(
                "UPDATE usuarios SET auth_type = $1 WHERE id = $2",
                ["hybrid", userId]
              );
            }

            console.log("Vinculando cuenta OAuth a usuario existente:", userId);
          } else {
            // Crear nuevo usuario
            const newUserResult = await pool.query(
              `INSERT INTO usuarios (username, email, rol, auth_type, password) 
             VALUES ($1, $2, $3, $4, NULL) 
             RETURNING id`,
              [email.split("@")[0], email, "usuario", "oauth"]
            );
            userId = newUserResult.rows[0].id;

            console.log("Nuevo usuario OAuth creado:", userId);
          }

          // Crear registro de cuenta OAuth
          await pool.query(
            `INSERT INTO oauth_accounts 
           (user_id, provider, provider_user_id, email, display_name, profile_photo, access_token, refresh_token) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              userId,
              "google",
              googleId,
              email,
              displayName,
              profilePhoto,
              accessToken,
              refreshToken,
            ]
          );
        }

        // Obtener información completa del usuario
        const userResult = await pool.query(
          `SELECT u.id, u.username, u.email, u.rol, u.id_departamento, u.auth_type,
                d.nombre as departamento_nombre
         FROM usuarios u
         LEFT JOIN departamentos d ON u.id_departamento = d.id
         WHERE u.id = $1`,
          [userId]
        );

        const user = userResult.rows[0];
        return done(null, user);
      } catch (error) {
        console.error("Error en Google OAuth Strategy:", error);
        return done(error, null);
      }
    }
  )
);

// Serialización del usuario (para sesiones, aunque usaremos JWT)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.rol, u.id_departamento, u.auth_type
       FROM usuarios u
       WHERE u.id = $1`,
      [id]
    );
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
