package main

import (
	"fmt"
	"io"
	"os"
)

func printCounts(w io.Writer, name string, c Counts) {
	fmt.Fprintf(w, "%d\t%d\t%d\t%s\n", c.lines, c.words, c.bytes, name)
}

func run(args []string, stdin io.Reader, stdout, stderr io.Writer) int {
	if len(args) == 0 {
		c, err := CountAll(stdin)
		if err != nil {
			fmt.Fprintf(stderr, "wordcount: -: %v\n", err)
			return 1
		}
		printCounts(stdout, "-", c)
		return 0
	}

	exitCode := 0
	var total Counts

	for _, name := range args {
		f, err := os.Open(name)
		if err != nil {
			fmt.Fprintf(stderr, "wordcount: %s: %v\n", name, err)
			exitCode = 1
			continue
		}

		c, err := CountAll(f)
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
