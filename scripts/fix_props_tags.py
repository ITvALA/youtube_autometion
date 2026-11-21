import re

path = 'remotion/src/cinematic/paper/library/props/PaperProps.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace <svg width=... height=... viewBox=... style={{ overflow: "visible" }}> with <g>
c = re.sub(r'<svg\s+width="[^"]*"\s+height="[^"]*"\s+viewBox="[^"]*"\s+style=\{\{\s*overflow:\s*"visible"\s*\}\}>', '<g>', c)
c = c.replace('</svg>', '</g>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Replaced svg with g in PaperProps.tsx successfully')
