package services

import (
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

/*
═══════════════════════════════════════════════════════
Auth Service — JWT + Password Hashing

Penjelasan:
1. Password di-hash menggunakan bcrypt (one-way hash)
   → Meskipun database bocor, password tidak bisa dibaca

2. JWT (JSON Web Token) digunakan untuk autentikasi
   → Setelah login, user mendapat token
   → Token ini dikirim di header setiap request
   → Server memverifikasi token tanpa perlu check DB tiap kali

3. Flow:
   Register: password → bcrypt.hash → simpan hash ke DB
   Login:    password → bcrypt.compare(password, hash) → JWT token
   Request:  JWT token → verify → extract user_id + role

4. JWT Claims:
   - sub: user ID
   - email: user email
   - role: super_agent / supervisor / agent
   - exp: expiry time (24 jam)
═══════════════════════════════════════════════════════
*/

// AuthService mengelola autentikasi (JWT + password)
type AuthService struct {
	JWTSecret     []byte        // Secret key untuk sign JWT
	TokenDuration time.Duration // Berapa lama token valid
}

// JWTClaims — data yang disimpan di dalam JWT token
type JWTClaims struct {
	UserID string `json:"sub"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// NewAuthService membuat instance baru
func NewAuthService(jwtSecret string) *AuthService {
	if jwtSecret == "" {
		jwtSecret = "cepat-chat-default-secret-2026-change-in-production"
	}
	log.Println("🔐 Auth service aktif")
	return &AuthService{
		JWTSecret:     []byte(jwtSecret),
		TokenDuration: 24 * time.Hour, // Token valid 24 jam
	}
}

// ── Password Functions ──

// HashPassword mengubah plain text password menjadi bcrypt hash
// Cost 12 = ~250ms per hash (cukup aman, tidak terlalu lambat)
func (s *AuthService) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return "", fmt.Errorf("gagal hash password: %w", err)
	}
	return string(bytes), nil
}

// CheckPassword memverifikasi plain text password dengan hash
// Return true jika cocok
func (s *AuthService) CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// ── JWT Functions ──

// GenerateToken membuat JWT token baru untuk user
func (s *AuthService) GenerateToken(userID, email, name, role string) (string, error) {
	claims := &JWTClaims{
		UserID: userID,
		Email:  email,
		Name:   name,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.TokenDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "cepat-chat",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.JWTSecret)
	if err != nil {
		return "", fmt.Errorf("gagal generate token: %w", err)
	}

	return tokenString, nil
}

// GenerateRefreshToken membuat refresh token (berlaku 7 hari)
func (s *AuthService) GenerateRefreshToken(userID string) (string, error) {
	claims := &jwt.RegisteredClaims{
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Issuer:    "cepat-chat-refresh",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.JWTSecret)
}

// ValidateToken memverifikasi JWT token dan mengekstrak claims
func (s *AuthService) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Pastikan signing method yang digunakan adalah HMAC
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.JWTSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("token invalid: %w", err)
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("token claims invalid")
	}

	return claims, nil
}

// ValidateRefreshToken memverifikasi refresh token
func (s *AuthService) ValidateRefreshToken(tokenString string) (string, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		return s.JWTSecret, nil
	})

	if err != nil {
		return "", fmt.Errorf("refresh token invalid: %w", err)
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return "", fmt.Errorf("refresh token claims invalid")
	}

	return claims.Subject, nil
}
