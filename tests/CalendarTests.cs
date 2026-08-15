using System.Linq;
using Xunit;

public class CalendarTests
{
    [Fact]
    public void MonthStartingOnMonday_PlacesFirstDayInMondayColumn()
    {
        var calendar = new Calendar();

        // January 2024 starts on a Monday.
        var grid = calendar.GetMonthGrid(2024, 1);

        Assert.Equal(1, grid[0][0]);
        for (int col = 1; col < 7; col++)
        {
            Assert.NotEqual(1, grid[0][col]);
        }
    }

    [Fact]
    public void MonthStartingOnSunday_PlacesFirstDayInSundayColumn()
    {
        var calendar = new Calendar();

        // September 2024 starts on a Sunday.
        var grid = calendar.GetMonthGrid(2024, 9);

        for (int col = 0; col < 6; col++)
        {
            Assert.Null(grid[0][col]);
        }

        Assert.Equal(1, grid[0][6]);
    }

    [Fact]
    public void LeapYearFebruary_Has29DayCellsIncludingThe29th()
    {
        var calendar = new Calendar();

        // 2024 is a leap year.
        var grid = calendar.GetMonthGrid(2024, 2);

        var days = grid.SelectMany(row => row).Where(day => day.HasValue).Select(day => day!.Value).ToList();

        Assert.Equal(29, days.Count);
        Assert.Contains(29, days);
    }

    [Fact]
    public void NonLeapYearFebruary_Has28DayCellsWithNo29th()
    {
        var calendar = new Calendar();

        // 2023 is not a leap year.
        var grid = calendar.GetMonthGrid(2023, 2);

        var days = grid.SelectMany(row => row).Where(day => day.HasValue).Select(day => day!.Value).ToList();

        Assert.Equal(28, days.Count);
        Assert.DoesNotContain(29, days);
    }
}
