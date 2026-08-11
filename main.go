package main

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"os"
)

type counts struct {
	lines int
	words int
	bytes int
}

func countAll(r io.Reader) (counts, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return counts{}, err
	}

	lines := bytes.Count(data, []byte("\n"))

	words := 0
	scanner := bufio.NewScanner(bytes.NewReader(data))
	scanner.Split(bufio.ScanWords)
	for scanner.Scan() {
		words++
	}
	if err := scanner.Err(); err != nil {
		return counts{}, err
	}

	return counts{lines: lines, words: words, bytes: len(data)}, nil
}

func main() {
	args := os.Args[1:]
	exitCode := 0

	if len(args) == 0 {
		c, err := countAll(os.Stdin)
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: -: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("%d\t%d\t%d\t%s\n", c.lines, c.words, c.bytes, "-")
		os.Exit(0)
	}

	var total counts
	processed := 0

	for _, name := range args {
		f, err := os.Open(name)
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: %s: %v\n", name, err)
			exitCode = 1
			continue
		}

		c, err := countAll(f)
		f.Close()
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: %s: %v\n", name, err)
			exitCode = 1
			continue
		}

		fmt.Printf("%d\t%d\t%d\t%s\n", c.lines, c.words, c.bytes, name)

		total.lines += c.lines
		total.words += c.words
		total.bytes += c.bytes
		processed++
	}

	if len(args) > 1 {
		fmt.Printf("%d\t%d\t%d\ttotal\n", total.lines, total.words, total.bytes)
	}

	os.Exit(exitCode)
}
