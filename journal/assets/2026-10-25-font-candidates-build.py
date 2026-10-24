# 시안 M29(2026-10-25-font-candidates-study.html)에 견본 글꼴과 잰 값을 넣는다.
# 쓰는 법: python 2026-10-25-font-candidates-build.py <재는 스크립트가 만든 JSON>
#   /*FONTS-BEGIN*/ … /*FONTS-END*/ 사이와 /*FACTS*/ 뒤의 값을 바꾼다. 여러 번 돌려도 된다.
import json, os, re, sys

data = json.load(open(sys.argv[1], encoding='utf8'))
page = os.path.join(os.path.dirname(os.path.abspath(__file__)), '2026-10-25-font-candidates-study.html')
html = open(page, encoding='utf8').read()

faces = []
for f in data:
    faces.append(f"@font-face {{ font-family: f-{f['id']}; src: url(data:font/woff2;base64,{f['sample_b64']}) format('woff2'); }}")
    faces.append(f"@font-face {{ font-family: f-{f['id']}-ksx; src: url(data:font/woff2;base64,{f['sample_ksx_b64']}) format('woff2'); }}")
html = re.sub(r'/\*FONTS-BEGIN\*/.*?/\*FONTS-END\*/', lambda m: '/*FONTS-BEGIN*/\n' + '\n'.join(faces) + '\n/*FONTS-END*/', html, flags=re.S)

facts = {f['id']: {k: v for k, v in f.items() if not k.endswith('b64')} for f in data}
html = re.sub(r'/\*FACTS\*/\{.*?\};', lambda m: '/*FACTS*/' + json.dumps(facts, ensure_ascii=False) + ';', html, flags=re.S)

open(page, 'w', encoding='utf8').write(html)
print('넣음:', ', '.join(f['name'] for f in data), f'({len(html) // 1024} KB)')
