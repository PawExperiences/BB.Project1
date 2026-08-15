using System;
using System.Globalization;
using System.Text;

internal static class Program
{
    private const int GridWidth = 20;

    private const string UsageMessage =
        "Usage: caltool [<year> <month>]\n" +
        "  year:  1-9999\n" +
        "  month: 1-12\n" +
        "Prints the current month if no arguments are given.";

    private static int Main(string[] args)
    {
        int year;
        int month;

        if (args.Length == 0)
        {
            var today = DateTime.Now;
            year = today.Year;
            month = today.Month;
        }
        else if (args.Length == 2)
        {
            if (!int.TryParse(args[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out year) ||
                !int.TryParse(args[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out month))
            {
                Console.Error.WriteLine(UsageMessage);
                return 2;
            }
        }
        else
        {
            Console.Error.WriteLine(UsageMessage);
            return 2;
        }

        if (year < 1 || year > 9999 || month < 1 || month > 12)
        {
            Console.Error.WriteLine(UsageMessage);
            return 2;
        }

        Console.WriteLine(RenderMonth(year, month));
        return 0;
    }

    private static string RenderMonth(int year, int month)
    {
        var culture = CultureInfo.InvariantCulture;
        var sb = new StringBuilder();

        string title = $"{culture.DateTimeFormat.GetMonthName(month)} {year:D4}";
        sb.AppendLine(Center(title, GridWidth));
        sb.AppendLine("Mo Tu We Th Fr Sa Su");

        int daysInMonth = DateTime.DaysInMonth(year, month);
        DayOfWeek firstDayOfWeek = new DateTime(year, month, 1).DayOfWeek;
        int leadingBlanks = ((int)firstDayOfWeek + 6) % 7; // Monday = 0 ... Sunday = 6

        int totalCells = leadingBlanks + daysInMonth;
        int rows = (int)Math.Ceiling(totalCells / 7.0);

        for (int row = 0; row < rows; row++)
        {
            var cells = new string[7];
            for (int col = 0; col < 7; col++)
            {
                int dayNumber = row * 7 + col - leadingBlanks + 1;
                cells[col] = dayNumber >= 1 && dayNumber <= daysInMonth
                    ? dayNumber.ToString(culture).PadLeft(2)
                    : "  ";
            }

            string line = string.Join(" ", cells);
            if (row < rows - 1)
            {
                sb.AppendLine(line);
            }
            else
            {
                sb.Append(line);
            }
        }

        return sb.ToString();
    }

    private static string Center(string text, int width)
    {
        if (text.Length >= width)
        {
            return text;
        }

        int totalPadding = width - text.Length;
        int leftPadding = totalPadding / 2;
        int rightPadding = totalPadding - leftPadding;
        return new string(' ', leftPadding) + text + new string(' ', rightPadding);
    }
}
