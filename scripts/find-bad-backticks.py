"""1012~1685 사이 escape 안 된 backtick 찾기"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/api/generate-tw/route.ts', encoding='utf-8') as f:
    lines = f.readlines()

BACKTICK = chr(96)
BACKSLASH = chr(92)

bad = []
for i, line in enumerate(lines[1011:1690], start=1012):
    j = 0
    while j < len(line):
        if line[j] == BACKSLASH:
            j += 2
            continue
        if line[j] == BACKTICK:
            ctx = line[max(0, j-30):j+10].replace('\n', '\\n')
            bad.append((i, j, ctx))
        j += 1

print(f'Total unescaped backticks: {len(bad)}')
for lineno, col, ctx in bad[:25]:
    print(f'L{lineno}:C{col}: ...{ctx}...')
