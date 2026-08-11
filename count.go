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
// Lines are counted as the number of '\n' bytes (wc -l semantics). Words are
// maximal runs of non-whitespace, matching bufio.ScanWords. Bytes are the
// total number of raw bytes read.
func Count(r io.Reader) (Counts, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return Counts{}, err
	}

	var c Counts
	c.Bytes = len(data)
	c.Lines = bytes.Count(data, []byte("\n"))

	scanner := bufio.NewScanner(bytes.NewReader(data))
	scanner.Split(bufio.ScanWords)
	for scanner.Scan() {
		c.Words++
	}

	return c, nil
}
