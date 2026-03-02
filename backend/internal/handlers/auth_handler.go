package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xinnxz/cekatin-backend/internal/services"
)

/*
═══════════════════════════════════════════════════════
Auth Handler — Register, Login, Profile

Endpoints:
- POST /api/auth/register  → Daftar user baru
- POST /api/auth/login     → Login → JWT token
- GET  /api/auth/me        → Profil user (butuh token)
- POST /api/auth/refresh   → Refresh expired token
- PATCH /api/auth/me       → Update profil (nama, avatar)
- GET  /api/auth/users     → List semua users (admin only)

Roles:
- super_agent  → Akses penuh (settings, billing, manage users)
- supervisor   → Manage tim, monitor agent, view analytics
- agent        → Handle chat yang di-assign saja
═══════════════════════════════════════════════════════
*/

// AuthHandler mengelola autentikasi
type AuthHandler struct {
	DB   *pgxpool.Pool
	Auth *services.AuthService
}

// Register — POST /api/auth/register
// Body: { email, password, name, role? }
// Default role: "agent"
func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
		Name     string `json:"name" binding:"required"`
		Role     string `json:"role"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email, password, dan name wajib diisi"})
		return
	}

	// Validasi password minimal 6 karakter
	if len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password minimal 6 karakter"})
		return
	}

	// Default role = agent
	if req.Role == "" {
		req.Role = "agent"
	}
	// Validasi role
	validRoles := map[string]bool{"super_agent": true, "supervisor": true, "agent": true}
	if !validRoles[req.Role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role harus: super_agent, supervisor, atau agent"})
		return
	}

	ctx := context.Background()

	// Cek apakah email sudah terdaftar
	var existingID string
	err := h.DB.QueryRow(ctx, `SELECT id FROM users WHERE email = $1`, req.Email).Scan(&existingID)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email sudah terdaftar"})
		return
	}

	// Hash password
	hash, err := h.Auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal proses password"})
		return
	}

	// Simpan user ke DB
	var userID string
	err = h.DB.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id`,
		req.Email, hash, req.Name, req.Role,
	).Scan(&userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal register: " + err.Error()})
		return
	}

	// Generate token langsung setelah register
	token, _ := h.Auth.GenerateToken(userID, req.Email, req.Name, req.Role)
	refreshToken, _ := h.Auth.GenerateRefreshToken(userID)

	log.Printf("🔐 User registered: %s (%s) as %s", req.Name, req.Email, req.Role)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Register berhasil",
		"user": gin.H{
			"id":    userID,
			"email": req.Email,
			"name":  req.Name,
			"role":  req.Role,
		},
		"token":         token,
		"refresh_token": refreshToken,
	})
}

// Login — POST /api/auth/login
// Body: { email, password }
func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email dan password wajib diisi"})
		return
	}

	ctx := context.Background()

	// Cari user di DB
	var userID, passwordHash, name, role, status string
	err := h.DB.QueryRow(ctx,
		`SELECT id, password_hash, name, role, status FROM users WHERE email = $1`,
		req.Email,
	).Scan(&userID, &passwordHash, &name, &role, &status)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email tidak ditemukan"})
		return
	}

	// Cek status user
	if status != "active" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akun Anda " + status + ". Hubungi admin."})
		return
	}

	// Verifikasi password
	if !h.Auth.CheckPassword(req.Password, passwordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password salah"})
		return
	}

	// Generate JWT tokens
	token, _ := h.Auth.GenerateToken(userID, req.Email, name, role)
	refreshToken, _ := h.Auth.GenerateRefreshToken(userID)

	// Update last_login_at
	h.DB.Exec(ctx, `UPDATE users SET last_login_at = NOW() WHERE id = $1`, userID)

	log.Printf("🔐 User login: %s (%s)", name, req.Email)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login berhasil",
		"user": gin.H{
			"id":    userID,
			"email": req.Email,
			"name":  name,
			"role":  role,
		},
		"token":         token,
		"refresh_token": refreshToken,
	})
}

// Me — GET /api/auth/me
// Butuh token di header: Authorization: Bearer <token>
func (h *AuthHandler) Me(c *gin.Context) {
	// User data sudah di-extract oleh middleware
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	ctx := context.Background()
	var email, name, role, avatarURL, status string
	var createdAt time.Time
	var lastLogin *time.Time

	err := h.DB.QueryRow(ctx,
		`SELECT email, name, role, avatar_url, status, last_login_at, created_at FROM users WHERE id = $1`,
		userID,
	).Scan(&email, &name, &role, &avatarURL, &status, &lastLogin, &createdAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":            userID,
			"email":         email,
			"name":          name,
			"role":          role,
			"avatar_url":    avatarURL,
			"status":        status,
			"last_login_at": lastLogin,
			"created_at":    createdAt,
		},
	})
}

// UpdateMe — PATCH /api/auth/me
// Body: { name?, avatar_url?, password? }
func (h *AuthHandler) UpdateMe(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Name      *string `json:"name"`
		AvatarURL *string `json:"avatar_url"`
		Password  *string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ctx := context.Background()

	if req.Name != nil {
		h.DB.Exec(ctx, `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2`, *req.Name, userID)
	}
	if req.AvatarURL != nil {
		h.DB.Exec(ctx, `UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2`, *req.AvatarURL, userID)
	}
	if req.Password != nil {
		if len(*req.Password) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password minimal 6 karakter"})
			return
		}
		hash, _ := h.Auth.HashPassword(*req.Password)
		h.DB.Exec(ctx, `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, hash, userID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profil updated"})
}

// RefreshToken — POST /api/auth/refresh
// Body: { refresh_token }
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh_token required"})
		return
	}

	// Validate refresh token
	userID, err := h.Auth.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token expired atau invalid"})
		return
	}

	ctx := context.Background()
	var email, name, role string
	err = h.DB.QueryRow(ctx,
		`SELECT email, name, role FROM users WHERE id = $1 AND status = 'active'`, userID,
	).Scan(&email, &name, &role)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Generate new tokens
	token, _ := h.Auth.GenerateToken(userID, email, name, role)
	newRefresh, _ := h.Auth.GenerateRefreshToken(userID)

	c.JSON(http.StatusOK, gin.H{
		"token":         token,
		"refresh_token": newRefresh,
	})
}

// ListUsers — GET /api/auth/users
// Admin only (super_agent)
func (h *AuthHandler) ListUsers(c *gin.Context) {
	role := c.GetString("user_role")
	if role != "super_agent" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya Super Agent yang bisa melihat list users"})
		return
	}

	ctx := context.Background()
	rows, err := h.DB.Query(ctx,
		`SELECT id, email, name, role, avatar_url, status, last_login_at, created_at 
		 FROM users ORDER BY created_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query users"})
		return
	}
	defer rows.Close()

	type UserInfo struct {
		ID        string     `json:"id"`
		Email     string     `json:"email"`
		Name      string     `json:"name"`
		Role      string     `json:"role"`
		AvatarURL string     `json:"avatar_url"`
		Status    string     `json:"status"`
		LastLogin *time.Time `json:"last_login_at"`
		CreatedAt time.Time  `json:"created_at"`
	}

	var users []UserInfo
	for rows.Next() {
		var u UserInfo
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.AvatarURL, &u.Status, &u.LastLogin, &u.CreatedAt); err == nil {
			users = append(users, u)
		}
	}
	if users == nil {
		users = []UserInfo{}
	}

	c.JSON(http.StatusOK, gin.H{"users": users, "total": len(users)})
}
