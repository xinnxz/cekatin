package services

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/smtp"
	"strings"
)

/*
═══════════════════════════════════════════════════════
Email Service — SMTP untuk kirim email

Penjelasan:
SMTP (Simple Mail Transfer Protocol) digunakan untuk mengirim email.
Service ini mendukung:
- Kirim email plain text dan HTML
- TLS/SSL encryption
- Attachment support (URL-based)

Konfigurasi dari .env:
  EMAIL_SMTP_HOST=smtp.gmail.com
  EMAIL_SMTP_PORT=587
  EMAIL_FROM=support@cepat.chat
  EMAIL_PASSWORD=app-password

Untuk Gmail, perlu App Password (bukan password account biasa)
═══════════════════════════════════════════════════════
*/

// EmailService mengelola pengiriman email via SMTP
type EmailService struct {
	SMTPHost     string // smtp.gmail.com, smtp.zoho.com, dll
	SMTPPort     string // 587 (TLS) atau 465 (SSL)
	FromEmail    string // alamat pengirim
	FromName     string // nama pengirim
	Password     string // password / app password
	IsConfigured bool   // apakah email sudah dikonfigurasi
}

// NewEmailService membuat instance baru EmailService
func NewEmailService(host, port, fromEmail, fromName, password string) *EmailService {
	configured := host != "" && fromEmail != "" && password != ""
	if configured {
		log.Printf("📧 Email service aktif (SMTP: %s:%s, From: %s)", host, port, fromEmail)
	} else {
		log.Println("⏸️ Email service nonaktif (EMAIL_SMTP_HOST tidak dikonfigurasi)")
	}
	return &EmailService{
		SMTPHost:     host,
		SMTPPort:     port,
		FromEmail:    fromEmail,
		FromName:     fromName,
		Password:     password,
		IsConfigured: configured,
	}
}

// EmailMessage struct untuk email yang akan dikirim
type EmailMessage struct {
	To      []string // Daftar penerima
	CC      []string // Carbon copy
	Subject string   // Subject email
	Body    string   // Body (plain text)
	HTML    string   // Body HTML (jika ada, diutamakan)
	ReplyTo string   // Reply-To header
}

// SendEmail mengirim email via SMTP
//
// Alur:
//  1. Buat header email (From, To, Subject, Content-Type)
//  2. Connect ke SMTP server via TLS
//  3. Authenticate dengan password
//  4. Kirim email
//
// Return: error jika gagal
func (s *EmailService) SendEmail(msg *EmailMessage) error {
	if !s.IsConfigured {
		return fmt.Errorf("email service not configured")
	}

	if len(msg.To) == 0 {
		return fmt.Errorf("no recipients specified")
	}

	// 1. Buat email headers + body
	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", s.FromName, s.FromEmail)
	headers["To"] = strings.Join(msg.To, ", ")
	headers["Subject"] = msg.Subject
	headers["MIME-Version"] = "1.0"

	if len(msg.CC) > 0 {
		headers["Cc"] = strings.Join(msg.CC, ", ")
	}
	if msg.ReplyTo != "" {
		headers["Reply-To"] = msg.ReplyTo
	}

	// Tentukan content type — HTML atau plain text
	body := msg.Body
	if msg.HTML != "" {
		headers["Content-Type"] = "text/html; charset=UTF-8"
		body = msg.HTML
	} else {
		headers["Content-Type"] = "text/plain; charset=UTF-8"
	}

	// 2. Format email message
	var emailBody strings.Builder
	for key, value := range headers {
		emailBody.WriteString(fmt.Sprintf("%s: %s\r\n", key, value))
	}
	emailBody.WriteString("\r\n")
	emailBody.WriteString(body)

	// 3. Connect ke SMTP server
	addr := s.SMTPHost + ":" + s.SMTPPort
	auth := smtp.PlainAuth("", s.FromEmail, s.Password, s.SMTPHost)

	// 4. Kirim via TLS
	// Untuk port 587 (STARTTLS)
	tlsConfig := &tls.Config{ServerName: s.SMTPHost}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		// Fallback: coba tanpa TLS (port 25 atau 587 dengan STARTTLS)
		allRecipients := append(msg.To, msg.CC...)
		err = smtp.SendMail(addr, auth, s.FromEmail, allRecipients, []byte(emailBody.String()))
		if err != nil {
			return fmt.Errorf("gagal kirim email: %w", err)
		}
		log.Printf("📧 Email terkirim (non-TLS) ke %s: %s", msg.To[0], msg.Subject)
		return nil
	}

	client, err := smtp.NewClient(conn, s.SMTPHost)
	if err != nil {
		return fmt.Errorf("gagal buat SMTP client: %w", err)
	}
	defer client.Close()

	// Authenticate
	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("gagal auth SMTP: %w", err)
	}

	// Set sender
	if err = client.Mail(s.FromEmail); err != nil {
		return fmt.Errorf("gagal set sender: %w", err)
	}

	// Set recipients (To + CC)
	allRecipients := append(msg.To, msg.CC...)
	for _, recipient := range allRecipients {
		if err = client.Rcpt(recipient); err != nil {
			return fmt.Errorf("gagal set recipient %s: %w", recipient, err)
		}
	}

	// Write body
	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("gagal buka data writer: %w", err)
	}
	_, err = writer.Write([]byte(emailBody.String()))
	if err != nil {
		return fmt.Errorf("gagal tulis email body: %w", err)
	}
	writer.Close()

	client.Quit()

	log.Printf("📧 Email terkirim ke %s: %s", msg.To[0], msg.Subject)
	return nil
}

// SendSimpleEmail — shortcut untuk kirim email simple (text only)
func (s *EmailService) SendSimpleEmail(to, subject, body string) error {
	return s.SendEmail(&EmailMessage{
		To:      []string{to},
		Subject: subject,
		Body:    body,
	})
}

// SendHTMLEmail — shortcut untuk kirim email HTML
func (s *EmailService) SendHTMLEmail(to, subject, html string) error {
	return s.SendEmail(&EmailMessage{
		To:      []string{to},
		Subject: subject,
		HTML:    html,
	})
}

// SendReplyEmail — kirim email reply (dengan Reply-To header)
func (s *EmailService) SendReplyEmail(to, subject, body, replyTo string) error {
	return s.SendEmail(&EmailMessage{
		To:      []string{to},
		Subject: subject,
		Body:    body,
		ReplyTo: replyTo,
	})
}
