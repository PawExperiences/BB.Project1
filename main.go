package main

import (
	"fmt"
	"os"
)

func main() {
	args := os.Args[1:]

	var exitCode int
	var totalLines, totalWords, totalBytes int

	report := func(name string, r *os.File) error {
		c, err := Count(r)
		if err != nil {
			return err
		}
		fmt.Printf("%d\t%d\t%d\t%s\n", c.Lines, c.Words, c.Bytes, name)
		totalLines += c.Lines
		totalWords += c.Words
		totalBytes += c.Bytes
		return nil
	}

	if len(args) == 0 {
		if err := report("-", os.Stdin); err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: -: %v\n", err)
			os.Exit(1)
		}
		os.Exit(0)
	}

	for _, name := range args {
		f, err := os.Open(name)
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: %s: %v\n", name, err)
			exitCode = 1
			continue
		}

		err = report(name, f)
		f.Close()
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: %s: %v\n", name, err)
			exitCode = 1
			continue
		}
	}

	if len(args) > 1 {
		fmt.Printf("%d\t%d\t%d\ttotal\n", totalLines, totalWords, totalBytes)
	}

	os.Exit(exitCode)
}
