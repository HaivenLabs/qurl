package qrflow

import (
	"encoding/json"
	"testing"
)

func TestEncodePayload(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		kind      string
		payload   any
		want      string
		wantError bool
	}{
		{
			name:    "url valid",
			kind:    "url",
			payload: UrlPayload{DestinationUrl: "https://example.com/path"},
			want:    "https://example.com/path",
		},
		{
			name:      "url invalid",
			kind:      "url",
			payload:   UrlPayload{DestinationUrl: "not-a-url"},
			wantError: true,
		},
		{
			name:    "text valid",
			kind:    "text",
			payload: TextPayload{Text: "hello world"},
			want:    "hello world",
		},
		{
			name:    "email valid",
			kind:    "email",
			payload: EmailPayload{To: "test@example.com", Subject: "Hi", Body: "Hello"},
			want:    "mailto:test@example.com?body=Hello&subject=Hi",
		},
		{
			name:    "email simple",
			kind:    "email",
			payload: EmailPayload{To: "test@example.com"},
			want:    "mailto:test@example.com",
		},
		{
			name:      "email invalid",
			kind:      "email",
			payload:   EmailPayload{To: "not-email"},
			wantError: true,
		},
		{
			name:    "phone valid",
			kind:    "phone",
			payload: PhonePayload{Number: "+1234567890"},
			want:    "tel:+1234567890",
		},
		{
			name:    "sms valid",
			kind:    "sms",
			payload: SmsPayload{Number: "+1234567890", Message: "Hello"},
			want:    "sms:+1234567890?body=Hello",
		},
		{
			name:    "wifi wpa2",
			kind:    "wifi",
			payload: WifiPayload{SSID: "MyNet", Security: "wpa2", Password: "pass"},
			want:    "WIFI:T:WPA2;S:MyNet;P:pass;H:false;;",
		},
		{
			name:    "wifi hidden no pass",
			kind:    "wifi",
			payload: WifiPayload{SSID: "MyNet", Security: "none", Hidden: true},
			want:    "WIFI:T:nopass;S:MyNet;P:;H:true;;",
		},
		{
			name:      "wifi protected requires password",
			kind:      "wifi",
			payload:   WifiPayload{SSID: "MyNet", Security: "wpa2"},
			wantError: true,
		},
		{
			name:      "wifi invalid security",
			kind:      "wifi",
			payload:   WifiPayload{SSID: "MyNet", Security: "banana", Password: "pass"},
			wantError: true,
		},
		{
			name:    "wifi escaping",
			kind:    "wifi",
			payload: WifiPayload{SSID: "My;Net", Security: "wpa", Password: `p\as:s`},
			want:    `WIFI:T:WPA;S:My\;Net;P:p\\as\:s;H:false;;`,
		},
		{
			name:    "vcard minimal",
			kind:    "vcard",
			payload: VCardPayload{FullName: "Ada Lovelace"},
			want:    "BEGIN:VCARD\nVERSION:3.0\nFN:Ada Lovelace\nEND:VCARD",
		},
		{
			name:    "vcard full",
			kind:    "vcard",
			payload: VCardPayload{FullName: "Ada Lovelace", Title: "Engineer"},
			want:    "BEGIN:VCARD\nVERSION:3.0\nFN:Ada Lovelace\nTITLE:Engineer\nEND:VCARD",
		},
		{
			name:      "vcard invalid email",
			kind:      "vcard",
			payload:   VCardPayload{FullName: "Ada Lovelace", Email: "not-email"},
			wantError: true,
		},
		{
			name:    "location with label",
			kind:    "location",
			payload: LocationPayload{Latitude: 47.6, Longitude: -122.3, Label: "Seattle"},
			want:    "geo:47.6,-122.3?q=47.6,-122.3(Seattle)",
		},
		{
			name:    "crypto btc",
			kind:    "crypto-address",
			payload: CryptoAddressPayload{Currency: "btc", Address: "1A1zP1", Amount: "1.5"},
			want:    "bitcoin:1A1zP1?amount=1.5",
		},
		{
			name:    "crypto eth",
			kind:    "crypto-address",
			payload: CryptoAddressPayload{Currency: "eth", Address: "0x123"},
			want:    "0x123",
		},
		{
			name:      "crypto invalid currency",
			kind:      "crypto-address",
			payload:   CryptoAddressPayload{Currency: "doge", Address: "abc"},
			wantError: true,
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			raw, err := json.Marshal(tc.payload)
			if err != nil {
				t.Fatalf("marshal error: %v", err)
			}

			got, err := EncodePayload(tc.kind, raw)
			if tc.wantError {
				if err == nil {
					t.Fatalf("expected error, got string %q", got)
				}
				return
			}

			if err != nil {
				t.Fatalf("EncodePayload error = %v", err)
			}

			if got != tc.want {
				t.Fatalf("encoded payload = %q, want %q", got, tc.want)
			}
		})
	}
}
