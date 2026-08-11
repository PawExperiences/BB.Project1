package main

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"os"
)

type counts struct {
	lines int64
	words int64
	bytes int64
}

func countAll(r io.Reader) (counts, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return counts{}, err
	}

	c := counts{bytes: int64(len(data))}
	c.lines = int64(bytes.Count(data, []byte{'\n'}))

	scanner := bufio.NewScanner(bytes.NewReader(data))
	scanner.Split(bufio.ScanWords)
	for scanner.Scan() {
		c.words++
	}
	if err := scanner.Err(); err != nil {
		return counts{}, err
	}

	return c, nil
}

func printCounts(w io.Writer, name string, c counts) {
	fmt.Fprintf(w, "%d\t%d\t%d\t%s\n", c.lines, c.words, c.bytes, name)
}

func run(args []string, stdin io.Reader, stdout, stderr io.Writer) int {
	if len(args) == 0 {
		c, err := countAll(stdin)
		if err != nil {
			fmt.Fprintf(stderr, "wordcount: -: %v\n", err)
			return 1
		}
		printCounts(stdout, "-", c)
		return 0
	}

	exitCode := 0
	var total counts

	for _, name := range args {
		f, err := os.Open(name)
		if err != nil {
			fmt.Fprintf(stderr, "wordcount: %s: %v\n", name, err)
			exitCode = 1
			continue
		}

		c, err := countAll(f)
		f.Close()
		if err != nil {
			fmt.Fprintf(stderr, "wordcount: %s: %v\n", name, err)
			exitCode = 1
			continue
		}

		printCounts(stdout, name, c)
		total.lines += c.lines
		total.words += c.words
		total.bytes += c.bytes
	}

	if len(args) > 1 {
		printCounts(stdout, "total", total)
	}

	return exitCode
}

func main() {
	os.Exit(run(os.Args[1:], os.Stdin, os.Stdout, os.Stderr))
}
