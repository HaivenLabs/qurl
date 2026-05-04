package qrflow

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strconv"
	"strings"
)

var (
	ErrUnknownPayloadKind = errors.New("unknown payload kind")
	ErrInvalidPayload     = errors.New("invalid payload data")
)

var emailPattern = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

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

func requiredString(value string, label string) (string, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "", fmt.Errorf("%w: %s is required", ErrInvalidPayload, label)
	}
	return trimmed, nil
}

func validateEmail(value string, label string) (string, error) {
	email, err := requiredString(value, label)
	if err != nil {
		return "", err
	}
	if !emailPattern.MatchString(email) {
		return "", fmt.Errorf("%w: %s must be a valid email address", ErrInvalidPayload, label)
	}
	return email, nil
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
	text, err := requiredString(p.Text, "text")
	if err != nil {
		return "", err
	}
	return text, nil
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
	to, err := validateEmail(p.To, "to")
	if err != nil {
		return "", err
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
		return fmt.Sprintf("mailto:%s?%s", to, query), nil
	}
	return fmt.Sprintf("mailto:%s", to), nil
}

type PhonePayload struct {
	Number string `json:"number"`
}

func encodePhone(raw []byte) (string, error) {
	p, err := parsePayload[PhonePayload](raw)
	if err != nil {
		return "", err
	}
	number, err := requiredString(p.Number, "number")
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("tel:%s", number), nil
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
	number, err := requiredString(p.Number, "number")
	if err != nil {
		return "", err
	}

	params := url.Values{}
	if p.Message != "" {
		params.Set("body", p.Message)
	}

	query := params.Encode()
	if query != "" {
		return fmt.Sprintf("sms:%s?%s", number, query), nil
	}
	return fmt.Sprintf("sms:%s", number), nil
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
	ssid, err := requiredString(p.SSID, "ssid")
	if err != nil {
		return "", err
	}

	auth := "WPA2"
	if p.Security != "" {
		switch p.Security {
		case "none":
			auth = "nopass"
		case "wpa", "wpa2", "wpa3":
			auth = strings.ToUpper(p.Security)
		default:
			return "", fmt.Errorf("%w: unsupported wifi security", ErrInvalidPayload)
		}
	}
	if auth != "nopass" && strings.TrimSpace(p.Password) == "" {
		return "", fmt.Errorf("%w: wifi password is required unless security is none", ErrInvalidPayload)
	}

	hidden := "false"
	if p.Hidden {
		hidden = "true"
	}

	return fmt.Sprintf("WIFI:T:%s;S:%s;P:%s;H:%s;;", auth, escapeWifi(ssid), escapeWifi(p.Password), hidden), nil
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
	fullName, err := requiredString(p.FullName, "full name")
	if err != nil {
		return "", err
	}
	if p.Email != "" {
		if _, err := validateEmail(p.Email, "email"); err != nil {
			return "", err
		}
	}
	if p.URL != "" {
		if _, err := ValidateDestination(p.URL); err != nil {
			return "", err
		}
	}

	var lines []string
	lines = append(lines, "BEGIN:VCARD")
	lines = append(lines, "VERSION:3.0")
	lines = append(lines, fmt.Sprintf("FN:%s", escapeVCard(fullName)))

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
	currency, err := requiredString(p.Currency, "currency")
	if err != nil {
		return "", err
	}
	address, err := requiredString(p.Address, "address")
	if err != nil {
		return "", err
	}
	if !isSupportedCryptoCurrency(currency) {
		return "", fmt.Errorf("%w: unsupported crypto currency", ErrInvalidPayload)
	}

	if currency == "btc" {
		params := url.Values{}
		if p.Amount != "" {
			params.Set("amount", p.Amount)
		}
		if p.Label != "" {
			params.Set("label", p.Label)
		}
		query := params.Encode()
		if query != "" {
			return fmt.Sprintf("bitcoin:%s?%s", address, query), nil
		}
		return fmt.Sprintf("bitcoin:%s", address), nil
	}

	return address, nil
}

func isSupportedCryptoCurrency(currency string) bool {
	switch currency {
	case "btc", "eth", "usdc", "sol", "ltc", "other":
		return true
	default:
		return false
	}
}
