package main

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestCount(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  Counts
	}{
		{
			name:  "empty input",
			input: "",
			want:  Counts{Lines: 0, Words: 0, Bytes: 0},
		},
		{
			name:  "single line with no trailing newline",
			input: "hello world",
			want:  Counts{Lines: 0, Words: 2, Bytes: 11},
		},
		{
			name:  "repeated spaces do not inflate word count",
			input: "foo   bar\n",
			want:  Counts{Lines: 1, Words: 2, Bytes: 10},
		},
		{
			name:  "multi-byte UTF-8 characters",
			input: "日本語\n",
			want:  Counts{Lines: 1, Words: 1, Bytes: 10},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Count(strings.NewReader(tt.input))
			if err != nil {
				t.Fatalf("Count() returned unexpected error: %v", err)
			}
			if got != tt.want {
				t.Fatalf("Count() = %+v, want %+v", got, tt.want)
			}
		})
	}
}

// TestCount_MultiByteBytesVsRunes documents that Bytes counts raw bytes, not
// runes: for input containing multi-byte UTF-8 characters, the byte length
// and the rune count differ.
func TestCount_MultiByteBytesVsRunes(t *testing.T) {
	input := "日本語\n"

	got, err := Count(strings.NewReader(input))
	if err != nil {
		t.Fatalf("Count() returned unexpected error: %v", err)
	}

	wantBytes := 10
	wantRunes := 4

	if got.Bytes != wantBytes {
		t.Fatalf("Bytes = %d, want %d", got.Bytes, wantBytes)
	}
	if gotRunes := utf8.RuneCountInString(input); gotRunes != wantRunes {
		t.Fatalf("utf8.RuneCountInString(input) = %d, want %d", gotRunes, wantRunes)
	}
	if got.Bytes == utf8.RuneCountInString(input) {
		t.Fatalf("expected byte count (%d) to differ from rune count (%d)", got.Bytes, utf8.RuneCountInString(input))
	}
}
