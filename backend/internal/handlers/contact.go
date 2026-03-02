package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xinnxz/cepatchat/internal/models"
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

// GetContactConversations — GET /api/contacts/:id/conversations
// Customer history: semua conversation untuk contact ini
func (h *ContactHandler) GetContactConversations(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()

	var phone string
	if err := h.DB.QueryRow(ctx, `SELECT phone FROM contacts WHERE id = $1`, id).Scan(&phone); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact not found"})
		return
	}

	rows, err := h.DB.Query(ctx,
		`SELECT id, platform, status, last_message, last_message_at, created_at
		 FROM conversations WHERE customer_phone = $1 ORDER BY created_at DESC`, phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query"})
		return
	}
	defer rows.Close()

	type ConvSummary struct {
		ID            string     `json:"id"`
		Platform      string     `json:"platform"`
		Status        string     `json:"status"`
		LastMessage   string     `json:"last_message"`
		LastMessageAt *time.Time `json:"last_message_at"`
		CreatedAt     time.Time  `json:"created_at"`
	}

	var convs []ConvSummary
	for rows.Next() {
		var cs ConvSummary
		if err := rows.Scan(&cs.ID, &cs.Platform, &cs.Status, &cs.LastMessage, &cs.LastMessageAt, &cs.CreatedAt); err != nil {
			continue
		}
		convs = append(convs, cs)
	}
	if convs == nil {
		convs = []ConvSummary{}
	}
	c.JSON(http.StatusOK, gin.H{"conversations": convs, "total": len(convs)})
}

// ExportContactsCSV — GET /api/contacts/export
// Download semua contacts sebagai CSV
func (h *ContactHandler) ExportContactsCSV(c *gin.Context) {
	rows, err := h.DB.Query(context.Background(),
		`SELECT name, email, phone, notes, tags, created_at FROM contacts ORDER BY created_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query"})
		return
	}
	defer rows.Close()

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=contacts.csv")
	c.Writer.WriteString("Name,Email,Phone,Notes,Tags,Created At\n")

	for rows.Next() {
		var name, email, phone, notes, tags string
		var createdAt time.Time
		if err := rows.Scan(&name, &email, &phone, &notes, &tags, &createdAt); err != nil {
			continue
		}
		// Escape commas in fields
		line := fmt.Sprintf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
			name, email, phone, notes, tags, createdAt.Format("2006-01-02 15:04:05"))
		c.Writer.WriteString(line)
	}
}
