package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/xinnxz/cepatchat/internal/services"
)

/*
═══════════════════════════════════════════════════════
Auth Middleware — Proteksi route dengan JWT

Penjelasan:
Middleware ini diletakkan di depan route yang butuh autentikasi.
Cara kerjanya:
1. Cek header "Authorization: Bearer <token>"
2. Extract token dari header
3. Validate token menggunakan AuthService.ValidateToken()
4. Jika valid → set user_id, user_email, user_role di context
5. Jika invalid → return 401 Unauthorized

Penggunaan:
  protected := router.Group("/api")
  protected.Use(middleware.AuthRequired(authService))
  protected.GET("/conversations", ...)

Context yang di-set:
  c.GetString("user_id")    → UUID user
  c.GetString("user_email") → email user
  c.GetString("user_name")  → nama user
  c.GetString("user_role")  → super_agent / supervisor / agent
═══════════════════════════════════════════════════════
*/

// AuthRequired memverifikasi JWT token di setiap request
func AuthRequired(auth *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Ambil Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token diperlukan. Kirim header: Authorization: Bearer <token>"})
			c.Abort()
			return
		}

		// 2. Extract token (format: "Bearer <token>")
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Format header salah. Gunakan: Bearer <token>"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// 3. Validate token
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired atau invalid: " + err.Error()})
			c.Abort()
			return
		}

		// 4. Set user data ke context — bisa diambil di handler
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_name", claims.Name)
		c.Set("user_role", claims.Role)

		// 5. Lanjut ke handler berikutnya
		c.Next()
	}
}

// RoleRequired memastikan user punya role tertentu
// Contoh: RoleRequired("super_agent", "supervisor")
func RoleRequired(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetString("user_role")

		for _, role := range allowedRoles {
			if userRole == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error": "Akses ditolak. Role Anda: " + userRole + ". Diperlukan: " + strings.Join(allowedRoles, " atau "),
		})
		c.Abort()
	}
}
