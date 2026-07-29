from pathlib import Path
import re
root = Path('src/pages')
pages = sorted(root.rglob('*.tsx'))
style_counts = []
style_re = re.compile(r'style=\{\{')
for p in pages:
    text = p.read_text(encoding='utf8')
    style_counts.append((str(p.relative_to(root)).replace('\\', '/').replace('.tsx', ''), len(style_re.findall(text))))
app = Path('src/App.tsx').read_text(encoding='utf8')
route_re = re.compile(r"['\"](\/[^'\"]+)['\"]\s*:\s*<([^>]+)>")
route_matches = [(m.group(1), m.group(2)) for m in route_re.finditer(app)]
import_re = re.compile(r"import \{[^\}]+\} from '\./pages/([^']+)'\")
imports = [m.group(1) for m in import_re.finditer(app)]
print('PAGE_COUNT', len(pages))
print('STYLE_COUNTS')
for path,count in sorted([x for x in style_counts if x[1] > 0], key=lambda x:(-x[1], x[0])):
    print(count, path)
print('ROUTE_COUNT', len(route_matches))
for r,c in sorted(route_matches):
    print(r, c)
print('IMPORT_COUNT', len(imports))
print('IMPORT_PAGES')
for imp in sorted(set(imports)):
    print(imp)
print('ORPHAN_COUNT')
imported_set = set(imports)
orphan_pages = [p for p,_ in style_counts if p not in imported_set]
print(len(orphan_pages))
for p in sorted(orphan_pages):
    print(p)
