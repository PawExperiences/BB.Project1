from factorlib.cli import main


def test_main_prints_factorisation_line_per_integer(capsys):
    exit_code = main(["12", "17"])

    captured = capsys.readouterr()
    assert captured.out == "12: 2 x 2 x 3\n17: 17\n"
    assert captured.err == ""
    assert exit_code == 0


def test_main_returns_zero_when_all_integers_succeed(capsys):
    exit_code = main(["12", "17", "49"])

    assert exit_code == 0


def test_main_stops_and_reports_error_on_first_failing_integer(capsys):
    exit_code = main(["12", "0", "17"])

    captured = capsys.readouterr()
    assert captured.out == "12: 2 x 2 x 3\n"
    assert "0" in captured.err
    assert exit_code == 1
