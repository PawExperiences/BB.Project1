package main

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"os"
)

func countAll(data []byte) (lines, words, bytesCount int) {
	bytesCount = len(data)
	lines = bytes.Count(data, []byte("\n"))

	scanner := bufio.NewScanner(bytes.NewReader(data))
	scanner.Split(bufio.ScanWords)
	for scanner.Scan() {
		words++
	}

	return lines, words, bytesCount
}

func main() {
	args := os.Args[1:]

	var exitCode int
	var totalLines, totalWords, totalBytes int

	report := func(name string, data []byte) {
		lines, words, bytesCount := countAll(data)
		fmt.Printf("%d\t%d\t%d\t%s\n", lines, words, bytesCount, name)
		totalLines += lines
		totalWords += words
		totalBytes += bytesCount
	}

	if len(args) == 0 {
		data, err := io.ReadAll(os.Stdin)
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: -: %v\n", err)
			os.Exit(1)
		}
		report("-", data)
		os.Exit(0)
	}

	for _, name := range args {
		f, err := os.Open(name)
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: %s: %v\n", name, err)
			exitCode = 1
			continue
		}

		data, err := io.ReadAll(f)
		f.Close()
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: %s: %v\n", name, err)
			exitCode = 1
			continue
		}

		report(name, data)
	}

	if len(args) > 1 {
		fmt.Printf("%d\t%d\t%d\ttotal\n", totalLines, totalWords, totalBytes)
	}

	os.Exit(exitCode)
}
