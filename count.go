package main

import (
	"bufio"
	"bytes"
	"io"
)

type Counts struct {
	Lines int
	Words int
	Bytes int
}

func CountReader(r io.Reader) (Counts, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return Counts{}, err
	}

	c := Counts{Bytes: len(data)}
	for _, b := range data {
		if b == '\n' {
			c.Lines++
		}
	}

	scanner := bufio.NewScanner(bytes.NewReader(data))
	scanner.Split(bufio.ScanWords)
	for scanner.Scan() {
		c.Words++
	}

	return c, nil
}
