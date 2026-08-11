package main

import (
	"bufio"
	"bytes"
	"io"
)

// Counts holds the line, word, and byte counts produced by Count.
type Counts struct {
	Lines int
	Words int
	Bytes int
}

// Count reads all data from r and returns the line, word, and byte counts.
// Lines are counted as the number of '\n' bytes encountered. Words are
// maximal runs of non-whitespace, per bufio.ScanWords semantics. Bytes are
// the raw byte count of the input.
func Count(r io.Reader) (Counts, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return Counts{}, err
	}

	lines := bytes.Count(data, []byte("\n"))

	words := 0
	scanner := bufio.NewScanner(bytes.NewReader(data))
	scanner.Split(bufio.ScanWords)
	for scanner.Scan() {
		words++
	}
	if err := scanner.Err(); err != nil {
		return Counts{}, err
	}

	return Counts{Lines: lines, Words: words, Bytes: len(data)}, nil
}
