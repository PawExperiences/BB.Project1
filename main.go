package main

import (
	"fmt"
	"os"
)

func main() {
	args := os.Args[1:]
	exitCode := 0

	if len(args) == 0 {
		c, err := Count(os.Stdin)
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: -: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("%d\t%d\t%d\t%s\n", c.Lines, c.Words, c.Bytes, "-")
		os.Exit(0)
	}

	var total Counts
	processed := 0

	for _, name := range args {
		f, err := os.Open(name)
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: %s: %v\n", name, err)
			exitCode = 1
			continue
		}

		c, err := Count(f)
		f.Close()
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: %s: %v\n", name, err)
			exitCode = 1
			continue
		}

		fmt.Printf("%d\t%d\t%d\t%s\n", c.Lines, c.Words, c.Bytes, name)

		total.Lines += c.Lines
		total.Words += c.Words
		total.Bytes += c.Bytes
		processed++
	}

	if len(args) > 1 {
		fmt.Printf("%d\t%d\t%d\ttotal\n", total.Lines, total.Words, total.Bytes)
	}

	os.Exit(exitCode)
}
