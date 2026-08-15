using System;
using System.Collections.Generic;

/// <summary>
/// Computes the visual week-row grid for a calendar month. This class is
/// limited to date/grid computation: no console output, no string
/// formatting, and no command-line argument parsing.
/// </summary>
public sealed class Calendar
{
    /// <summary>
    /// Returns the month's grid as a sequence of week-rows. Each row has
    /// exactly 7 day-slots ordered Monday through Sunday. A slot holds the
    /// 1-based day number for in-month days, or <c>null</c> for the blanks
    /// that pad the first row (before the 1st) and the last row (after the
    /// last day). Only as many rows as needed to cover the month are
    /// returned.
    /// </summary>
    public IReadOnlyList<IReadOnlyList<int?>> GetMonthGrid(int year, int month)
    {
        int daysInMonth = DateTime.DaysInMonth(year, month);
        DayOfWeek firstDayOfWeek = new DateTime(year, month, 1).DayOfWeek;
        int leadingBlanks = ((int)firstDayOfWeek + 6) % 7; // Monday = 0 ... Sunday = 6

        int totalCells = leadingBlanks + daysInMonth;
        int rowCount = (int)Math.Ceiling(totalCells / 7.0);

        var rows = new List<IReadOnlyList<int?>>(rowCount);
        for (int row = 0; row < rowCount; row++)
        {
            var cells = new int?[7];
            for (int col = 0; col < 7; col++)
            {
                int dayNumber = row * 7 + col - leadingBlanks + 1;
                cells[col] = dayNumber >= 1 && dayNumber <= daysInMonth ? dayNumber : null;
            }

            rows.Add(cells);
        }

        return rows;
    }
}
