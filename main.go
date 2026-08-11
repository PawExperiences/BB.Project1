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

func countBytes(data []byte) counts {
	c := counts{bytes: len(data)}
	for _, b := range data {
		if b == '\n' {
			c.lines++
		}
	}
	scanner := bufio.NewScanner(bytes.NewReader(data))
	scanner.Split(bufio.ScanWords)
	for scanner.Scan() {
		c.words++
	}
	return c
}

func main() {
	args := os.Args[1:]

	var total counts
	failed := false

	printLine := func(c counts, name string) {
		fmt.Printf("%d\t%d\t%d\t%s\n", c.lines, c.words, c.bytes, name)
	}

	if len(args) == 0 {
		data, err := io.ReadAll(os.Stdin)
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: -: %v\n", err)
			os.Exit(1)
		}
		printLine(countBytes(data), "-")
		return
	}

	for _, name := range args {
		f, err := os.Open(name)
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: %s: %v\n", name, err)
			failed = true
			continue
		}
		data, err := io.ReadAll(f)
		f.Close()
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: %s: %v\n", name, err)
			failed = true
			continue
		}
		c := countBytes(data)
		printLine(c, name)
		total.lines += c.lines
		total.words += c.words
		total.bytes += c.bytes
	}

	if len(args) > 1 {
		printLine(total, "total")
	}

	if failed {
		os.Exit(1)
	}
}
