package main

import (
	"fmt"
	"os"
)

func main() {
	args := os.Args[1:]

	var total Counts
	failed := false

	printLine := func(c Counts, name string) {
		fmt.Printf("%d\t%d\t%d\t%s\n", c.Lines, c.Words, c.Bytes, name)
	}

	if len(args) == 0 {
		c, err := CountReader(os.Stdin)
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: -: %v\n", err)
			os.Exit(1)
		}
		printLine(c, "-")
		return
	}

	for _, name := range args {
		f, err := os.Open(name)
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: %s: %v\n", name, err)
			failed = true
			continue
		}
		c, err := CountReader(f)
		f.Close()
		if err != nil {
			fmt.Fprintf(os.Stderr, "wordcount: %s: %v\n", name, err)
			failed = true
			continue
		}
		printLine(c, name)
		total.Lines += c.Lines
		total.Words += c.Words
		total.Bytes += c.Bytes
	}

	if len(args) > 1 {
		printLine(total, "total")
	}

	if failed {
		os.Exit(1)
	}
}
