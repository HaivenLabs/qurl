package qrflow

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

var (
	ErrUnknownPayloadKind = errors.New("unknown payload kind")
	ErrInvalidPayload     = errors.New("invalid payload data")
)

func EncodePayload(kind string, raw []byte) (string, error) {
	switch kind {
	case "url":
		return encodeUrl(raw)
	case "text":
		return encodeText(raw)
	case "email":
		return encodeEmail(raw)
	case "phone":
		return encodePhone(raw)
	case "sms":
		return encodeSms(raw)
	case "wifi":
		return encodeWifi(raw)
	case "vcard":
		return encodeVCard(raw)
	case "location":
		return encodeLocation(raw)
	case "crypto-address":
		return encodeCryptoAddress(raw)
	default:
		return "", fmt.Errorf("%w: %q", ErrUnknownPayloadKind, kind)
	}
}

func parsePayload[T any](raw []byte) (T, error) {
	var payload T
	if err := json.Unmarshal(raw, &payload); err != nil {
		return payload, fmt.Errorf("%w: %v", ErrInvalidPayload, err)
	}
	return payload, nil
}

type UrlPayload struct {
	DestinationUrl string `json:"destinationUrl"`
}

func encodeUrl(raw []byte) (string, error) {
	p, err := parsePayload[UrlPayload](raw)
	if err != nil {
		return "", err
	}
	parsed, err := ValidateDestination(p.DestinationUrl)
	if err != nil {
		return "", err
	}
	return parsed.String(), nil
}

type TextPayload struct {
	Text string `json:"text"`
}

func encodeText(raw []byte) (string, error) {
	p, err := parsePayload[TextPayload](raw)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(p.Text) == "" {
		return "", fmt.Errorf("%w: text is required", ErrInvalidPayload)
	}
	return p.Text, nil
}

type EmailPayload struct {
	To      string `json:"to"`
	Subject string `json:"subject,omitempty"`
	Body    string `json:"body,omitempty"`
}

func encodeEmail(raw []byte) (string, error) {
	p, err := parsePayload[EmailPayload](raw)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(p.To) == "" {
		return "", fmt.Errorf("%w: to is required", ErrInvalidPayload)
	}
	
	params := url.Values{}
	if p.Subject != "" {
		params.Set("subject", p.Subject)
	}
	if p.Body != "" {
		params.Set("body", p.Body)
	}
	
	query := params.Encode()
	if query != "" {
		return fmt.Sprintf("mailto:%s?%s", p.To, query), nil
	}
	return fmt.Sprintf("mailto:%s", p.To), nil
}

type PhonePayload struct {
	Number string `json:"number"`
}

func encodePhone(raw []byte) (string, error) {
	p, err := parsePayload[PhonePayload](raw)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(p.Number) == "" {
		return "", fmt.Errorf("%w: number is required", ErrInvalidPayload)
	}
	return fmt.Sprintf("tel:%s", p.Number), nil
}

type SmsPayload struct {
	Number  string `json:"number"`
	Message string `json:"message,omitempty"`
}

func encodeSms(raw []byte) (string, error) {
	p, err := parsePayload[SmsPayload](raw)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(p.Number) == "" {
		return "", fmt.Errorf("%w: number is required", ErrInvalidPayload)
	}
	
	params := url.Values{}
	if p.Message != "" {
		params.Set("body", p.Message)
	}
	
	query := params.Encode()
	if query != "" {
		return fmt.Sprintf("sms:%s?%s", p.Number, query), nil
	}
	return fmt.Sprintf("sms:%s", p.Number), nil
}

type WifiPayload struct {
	SSID     string `json:"ssid"`
	Security string `json:"security,omitempty"`
	Password string `json:"password,omitempty"`
	Hidden   bool   `json:"hidden,omitempty"`
}

func escapeWifi(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, ";", "\\;")
	s = strings.ReplaceAll(s, ",", "\\,")
	s = strings.ReplaceAll(s, ":", "\\:")
	s = strings.ReplaceAll(s, "\"", "\\\"")
	return s
}

func encodeWifi(raw []byte) (string, error) {
	p, err := parsePayload[WifiPayload](raw)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(p.SSID) == "" {
		return "", fmt.Errorf("%w: ssid is required", ErrInvalidPayload)
	}
	
	auth := "WPA2"
	if p.Security != "" {
		if p.Security == "none" {
			auth = "nopass"
		} else {
			auth = strings.ToUpper(p.Security)
		}
	}
	
	hidden := "false"
	if p.Hidden {
		hidden = "true"
	}
	
	return fmt.Sprintf("WIFI:T:%s;S:%s;P:%s;H:%s;;", auth, escapeWifi(p.SSID), escapeWifi(p.Password), hidden), nil
}

type VCardPayload struct {
	FullName     string `json:"fullName"`
	Organization string `json:"organization,omitempty"`
	Title        string `json:"title,omitempty"`
	Phone        string `json:"phone,omitempty"`
	Email        string `json:"email,omitempty"`
	URL          string `json:"url,omitempty"`
}

func escapeVCard(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "\n", "\\n")
	s = strings.ReplaceAll(s, ",", "\\,")
	s = strings.ReplaceAll(s, ";", "\\;")
	return s
}

func encodeVCard(raw []byte) (string, error) {
	p, err := parsePayload[VCardPayload](raw)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(p.FullName) == "" {
		return "", fmt.Errorf("%w: full name is required", ErrInvalidPayload)
	}
	
	var lines []string
	lines = append(lines, "BEGIN:VCARD")
	lines = append(lines, "VERSION:3.0")
	lines = append(lines, fmt.Sprintf("FN:%s", escapeVCard(p.FullName)))
	
	if p.Organization != "" {
		lines = append(lines, fmt.Sprintf("ORG:%s", escapeVCard(p.Organization)))
	}
	if p.Title != "" {
		lines = append(lines, fmt.Sprintf("TITLE:%s", escapeVCard(p.Title)))
	}
	if p.Phone != "" {
		lines = append(lines, fmt.Sprintf("TEL:%s", escapeVCard(p.Phone)))
	}
	if p.Email != "" {
		lines = append(lines, fmt.Sprintf("EMAIL:%s", p.Email))
	}
	if p.URL != "" {
		lines = append(lines, fmt.Sprintf("URL:%s", p.URL))
	}
	
	lines = append(lines, "END:VCARD")
	return strings.Join(lines, "\n"), nil
}

type LocationPayload struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Label     string  `json:"label,omitempty"`
}

func encodeLocation(raw []byte) (string, error) {
	p, err := parsePayload[LocationPayload](raw)
	if err != nil {
		return "", err
	}
	if p.Latitude < -90 || p.Latitude > 90 || p.Longitude < -180 || p.Longitude > 180 {
		return "", fmt.Errorf("%w: invalid coordinates", ErrInvalidPayload)
	}
	
	lat := strconv.FormatFloat(p.Latitude, 'f', -1, 64)
	lon := strconv.FormatFloat(p.Longitude, 'f', -1, 64)
	base := fmt.Sprintf("geo:%s,%s", lat, lon)
	
	if p.Label != "" {
		return fmt.Sprintf("%s?q=%s,%s(%s)", base, lat, lon, url.QueryEscape(p.Label)), nil
	}
	return base, nil
}

type CryptoAddressPayload struct {
	Currency string `json:"currency"`
	Address  string `json:"address"`
	Amount   string `json:"amount,omitempty"`
	Label    string `json:"label,omitempty"`
}

func encodeCryptoAddress(raw []byte) (string, error) {
	p, err := parsePayload[CryptoAddressPayload](raw)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(p.Currency) == "" || strings.TrimSpace(p.Address) == "" {
		return "", fmt.Errorf("%w: currency and address are required", ErrInvalidPayload)
	}
	
	if p.Currency == "btc" {
		params := url.Values{}
		if p.Amount != "" {
			params.Set("amount", p.Amount)
		}
		if p.Label != "" {
			params.Set("label", p.Label)
		}
		query := params.Encode()
		if query != "" {
			return fmt.Sprintf("bitcoin:%s?%s", p.Address, query), nil
		}
		return fmt.Sprintf("bitcoin:%s", p.Address), nil
	}
	
	// For other currencies, just return the address directly as per frontend encodeQrPayload
	return p.Address, nil
}
