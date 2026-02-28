package middleware

import (
	"github.com/gin-gonic/gin"
)

/*
═══════════════════════════════════════════════════════
CORS Middleware — Izinkan dashboard Next.js akses API

Penjelasan:
- CORS (Cross-Origin Resource Sharing) diperlukan karena
  dashboard berjalan di port 3000 dan backend di port 8080
- Browser secara default memblokir request cross-origin
- Middleware ini menambahkan header CORS ke setiap response

Headers yang ditambahkan:
- Access-Control-Allow-Origin  → URL dashboard yang diizinkan
- Access-Control-Allow-Methods → HTTP methods yang diizinkan
- Access-Control-Allow-Headers → Custom headers yang diizinkan
═══════════════════════════════════════════════════════
*/

// CORSMiddleware mengizinkan cross-origin requests dari dashboard
func CORSMiddleware(dashboardURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Izinkan request dari dashboard URL
		c.Header("Access-Control-Allow-Origin", dashboardURL)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		// Preflight request (OPTIONS) → langsung return 204
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
