package main

import (
	"bufio"
	"bytes"
	"io"
)

type Counts struct {
	lines int64
	words int64
	bytes int64
}

func CountAll(r io.Reader) (Counts, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return Counts{}, err
	}

	c := Counts{bytes: int64(len(data))}
	c.lines = int64(bytes.Count(data, []byte{'\n'}))

	scanner := bufio.NewScanner(bytes.NewReader(data))
	scanner.Split(bufio.ScanWords)
	for scanner.Scan() {
		c.words++
	}
	if err := scanner.Err(); err != nil {
		return Counts{}, err
	}

	return c, nil
}
