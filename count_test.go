package main

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestCountAll(t *testing.T) {
	// wantByteRune, when true, asserts that the input's byte count differs
	// from its rune (character) count.
	tests := []struct {
		name         string
		input        string
		want         Counts
		wantByteRune bool
	}{
		{
			name:  "empty reader",
			input: "",
			want:  Counts{lines: 0, words: 0, bytes: 0},
		},
		{
			name:  "single line with no trailing newline",
			input: "hello world",
			want:  Counts{lines: 0, words: 2, bytes: 11},
		},
		{
			name:  "line with repeated consecutive spaces",
			input: "hello   world\n",
			want:  Counts{lines: 1, words: 2, bytes: 14},
		},
		{
			name:         "multi-byte UTF-8 character",
			input:        "héllo\n",
			want:         Counts{lines: 1, words: 1, bytes: 7},
			wantByteRune: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := CountAll(strings.NewReader(tt.input))
			if err != nil {
				t.Fatalf("CountAll(%q) returned error: %v", tt.input, err)
			}
			if got != tt.want {
				t.Errorf("CountAll(%q) = %+v, want %+v", tt.input, got, tt.want)
			}
			if tt.wantByteRune {
				runeCount := int64(utf8.RuneCountInString(tt.input))
				if got.bytes == runeCount {
					t.Errorf("expected byte count (%d) to differ from rune count (%d) for %q", got.bytes, runeCount, tt.input)
				}
			}
		})
	}
}
