package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xinnxz/cekatin-backend/internal/models"
)

/*
═══════════════════════════════════════════════════════
Contact Handler — CRUD untuk profil customer

Endpoints:
- GET    /api/contacts            → List all contacts
- GET    /api/contacts/:id        → Get contact by ID
- GET    /api/contacts/phone/:ph  → Get contact by phone
- POST   /api/contacts            → Create contact
- PATCH  /api/contacts/:id        → Update contact (partial)
═══════════════════════════════════════════════════════
*/

type ContactHandler struct {
	DB *pgxpool.Pool
}

const contactColumns = `id, name, email, phone, notes, tags, avatar_url, created_at, updated_at`

func scanContact(scan func(dest ...any) error) (models.Contact, error) {
	var c models.Contact
	err := scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.Notes, &c.Tags, &c.AvatarURL, &c.CreatedAt, &c.UpdatedAt)
	return c, err
}

// ListContacts — GET /api/contacts
func (h *ContactHandler) ListContacts(c *gin.Context) {
	rows, err := h.DB.Query(context.Background(),
		`SELECT `+contactColumns+` FROM contacts ORDER BY updated_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query contacts"})
		return
	}
	defer rows.Close()

	var contacts []models.Contact
	for rows.Next() {
		contact, err := scanContact(rows.Scan)
		if err != nil {
			continue
		}
		contacts = append(contacts, contact)
	}
	if contacts == nil {
		contacts = []models.Contact{}
	}
	c.JSON(http.StatusOK, gin.H{"contacts": contacts})
}

// GetContact — GET /api/contacts/:id
func (h *ContactHandler) GetContact(c *gin.Context) {
	id := c.Param("id")
	row := h.DB.QueryRow(context.Background(),
		`SELECT `+contactColumns+` FROM contacts WHERE id = $1`, id)
	contact, err := scanContact(row.Scan)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"contact": contact})
}

// GetContactByPhone — GET /api/contacts/phone/:phone
func (h *ContactHandler) GetContactByPhone(c *gin.Context) {
	phone := c.Param("phone")
	row := h.DB.QueryRow(context.Background(),
		`SELECT `+contactColumns+` FROM contacts WHERE phone = $1`, phone)
	contact, err := scanContact(row.Scan)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"contact": contact})
}

// CreateContact — POST /api/contacts
func (h *ContactHandler) CreateContact(c *gin.Context) {
	var body struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Phone string `json:"phone" binding:"required"`
		Notes string `json:"notes"`
		Tags  string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phone is required"})
		return
	}

	row := h.DB.QueryRow(context.Background(),
		`INSERT INTO contacts (name, email, phone, notes, tags)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (phone) DO UPDATE SET
		   name = COALESCE(NULLIF($1, ''), contacts.name),
		   email = COALESCE(NULLIF($2, ''), contacts.email),
		   notes = COALESCE(NULLIF($4, ''), contacts.notes),
		   tags = COALESCE(NULLIF($5, ''), contacts.tags),
		   updated_at = NOW()
		 RETURNING `+contactColumns,
		body.Name, body.Email, body.Phone, body.Notes, body.Tags,
	)
	contact, err := scanContact(row.Scan)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create contact: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"contact": contact})
}

// UpdateContact — PATCH /api/contacts/:id
func (h *ContactHandler) UpdateContact(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Name  *string `json:"name"`
		Email *string `json:"email"`
		Notes *string `json:"notes"`
		Tags  *string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ctx := context.Background()
	now := time.Now()

	// Build dynamic update query
	if body.Name != nil {
		h.DB.Exec(ctx, `UPDATE contacts SET name = $1, updated_at = $2 WHERE id = $3`, *body.Name, now, id)
	}
	if body.Email != nil {
		h.DB.Exec(ctx, `UPDATE contacts SET email = $1, updated_at = $2 WHERE id = $3`, *body.Email, now, id)
	}
	if body.Notes != nil {
		h.DB.Exec(ctx, `UPDATE contacts SET notes = $1, updated_at = $2 WHERE id = $3`, *body.Notes, now, id)
	}
	if body.Tags != nil {
		h.DB.Exec(ctx, `UPDATE contacts SET tags = $1, updated_at = $2 WHERE id = $3`, *body.Tags, now, id)
	}

	// Return updated contact
	row := h.DB.QueryRow(ctx, `SELECT `+contactColumns+` FROM contacts WHERE id = $1`, id)
	contact, err := scanContact(row.Scan)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"contact": contact})
}
