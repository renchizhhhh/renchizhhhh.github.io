"""Create complete Chinese counterparts, failing on untranslated prose."""
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import json

ROOT = Path(__file__).parent
TRANSLATIONS = json.loads((ROOT / 'translations.zh.json').read_text())
TRANSLATIONS.update({'中文': 'English', 'dark': '深色'})
ATTRIBUTES = {
    'Main navigation': '主导航',
    'Display preferences': '显示设置',
    'Switch to Chinese': 'Switch to English',
    'Switch to dark mode': '切换至深色模式',
    'Pixel-art robot arm holding a blue chess pawn': '夹着蓝色棋子的像素风机械臂',
    'OpenChessRobot hardware with Franka Panda arm, chessboard and sensing system': 'OpenChessRobot 的 Franka Panda 机械臂、棋盘及感知硬件',
    'Visitors playing chess with OpenChessRobot at a demonstration': '演示活动中与 OpenChessRobot 下棋的参观者',
    'Examples of 3D visual-search scenes containing geometric objects of different colours, shapes and sizes': '包含不同颜色、形状和大小几何物体的三维视觉搜索场景示例',
    'OpenChessRobot demonstration video': 'OpenChessRobot 演示视频',
    'Walk-along Spot experiment video': '与 Spot 同行实验视频',
    'LLM robotics workshop demonstration video': 'LLM 机器人工作坊演示视频',
    "Open Conway's Game of Life": '打开康威生命游戏',
    "Conway's Game of Life": '康威生命游戏',
    'Do not press this button': '不要按这个按钮',
}

class ChinesePage(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.output = []
        self.untranslated = set()

    def handle_decl(self, decl):
        self.output.append('<!' + decl + '>')

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        language_link = 'language-switch' in data.get('class', '').split()
        converted = []
        for key, value in attrs:
            if key == 'lang':
                value = 'zh-CN' if tag == 'html' else ('en' if value == 'zh' else value)
            elif language_link and key == 'hreflang':
                value = 'en'
            elif language_link and key == 'href':
                value = value.removeprefix('/zh') or '/'
            elif tag == 'a' and key == 'href' and value.startswith('/') and not value.startswith('/assets/'):
                value = '/zh' + value
            elif key in ('alt', 'aria-label', 'title') and value:
                if value not in ATTRIBUTES:
                    raise ValueError(f'Missing attribute translation: {value!r}')
                value = ATTRIBUTES[value]
            elif tag == 'meta' and data.get('name') == 'description' and key == 'content':
                value = '张任驰的研究、机器人系统、实验与笔记。关注人机交互、具身智能，以及人类与 AI 的互补。'
            converted.append(key if value is None else f'{key}="{escape(value, quote=True)}"')
        self.output.append('<' + tag + (' ' if converted else '') + ' '.join(converted) + '>')

    def handle_endtag(self, tag):
        self.output.append('</' + tag + '>')

    def handle_data(self, data):
        if data.strip() and data not in TRANSLATIONS:
            self.untranslated.add(data)
        self.output.append(escape(TRANSLATIONS.get(data, data), quote=False))

    def handle_comment(self, data):
        self.output.append('<!--' + data + '-->')

def build_chinese(out):
    pages = [p for p in out.rglob('*.html') if p.relative_to(out).parts[0] != 'zh']
    for source in pages:
        parser = ChinesePage()
        parser.feed(source.read_text())
        parser.close()
        if parser.untranslated:
            raise ValueError(f'{source}: missing Chinese copy: {parser.untranslated}')
        target = out / 'zh' / source.relative_to(out)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(''.join(parser.output))
    print(f'Generated {len(pages)} Chinese pages')
