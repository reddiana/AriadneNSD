# 시안과 스파이크 페이지(journal/assets/*.html)의 맨 아래에 라이선스 안내 한 단락을 넣는다 (ADR-0027)
#
#   py -X utf8 journal/assets/2026-10-14-add-license-note.py
#
# - 이미 안내가 들어 있는 파일(data-license-note)은 건드리지 않는다. 몇 번을 돌려도 같다.
# - 프로토타입은 코드(Apache-2.0)라서 넣지 않는다.
# - 글자 폭 스파이크는 만드는 스크립트(…-spike-build.py)가 이 파일의 note()를 불러 넣는다.
import glob, os

HERE = os.path.dirname(os.path.abspath(__file__))
SKIP = {'2026-10-10-ns-prototype.html'}
EXTRA = {
    '2026-10-10-logo-concepts.html': 'logo',
    '2026-10-11-wordmark-any-background.html': 'logo',
    '2026-10-13-text-width-spike.html': 'font',
}
LOGO = (' <b>로고 그림(그림 로고와 문자 로고)은 여기에 들지 않습니다.</b> 이 프로젝트를 가리키는 데에만 쓸 수 있습니다.'
        ' 바탕이 된 메트로폴리탄 미술관의 사진은 CC0입니다. <span lang="en">The logo artwork is excluded and may be used only to refer to this project.</span>')
FONT = ' 페이지에 넣은 글꼴 조각은 Pretendard(SIL Open Font License 1.1)입니다.'


def note(kind=None):
    extra = LOGO if kind == 'logo' else FONT if kind == 'font' else ''
    return (
        '\n<footer data-license-note style="max-width:1240px;margin:32px auto 0;padding:14px 20px 40px;'
        'font-size:13px;line-height:1.6;opacity:.8;border-top:1px solid currentColor">'
        '이 페이지는 <a href="https://github.com/reddiana/AriadneNSD" style="color:inherit">AriadneNSD</a>의 시안입니다. '
        '글과 그림은 <a href="https://creativecommons.org/licenses/by/4.0/deed.ko" style="color:inherit">CC BY 4.0</a>으로 공개합니다. '
        '출처를 "AriadneNSD (https://github.com/reddiana/AriadneNSD)"로 밝히면 옮기거나 고쳐 쓸 수 있습니다.'
        + extra +
        ' <span lang="en">A design study from the AriadneNSD project. Text and figures are licensed under CC BY 4.0.</span>'
        '</footer>\n'
    )


def main():
    for path in sorted(glob.glob(os.path.join(HERE, '*.html'))):
        name = os.path.basename(path)
        if name in SKIP:
            print('건너뜀 (코드)   ', name)
            continue
        s = open(path, encoding='utf-8').read()
        if 'data-license-note' in s:
            print('이미 있음       ', name)
            continue
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(s.rstrip('\n') + '\n' + note(EXTRA.get(name)))
        print('넣음            ', name)


if __name__ == '__main__':
    main()
