import shutil
import subprocess
import sys


def main():
    args = sys.argv[1:]

    if shutil.which('mdpdf') is None:
        print("-> 'mdpdf' not found on PATH, installing package in editable mode")
        subprocess.run([sys.executable, '-m', 'pip', 'install', '--quiet', '-e', '.'], check=True)

    if args:
        print('-> Running: mdpdf ' + ' '.join(args))
        subprocess.run(['mdpdf'] + args, check=True)
        return

    output_path = 'mdpdf_output.html'
    print('-> No arguments given, converting the bundled sample.md')
    print('-> Running: mdpdf sample.md -o {}'.format(output_path))
    subprocess.run(['mdpdf', 'sample.md', '-o', output_path], check=True)
    print('-> Wrote {}'.format(output_path))
    print('-> Open it in a browser and use Print > Save as PDF to produce a PDF')


if __name__ == '__main__':
    main()
