# -*- coding: utf-8 -*-
"""自检：28 页节点、视频文件、卡片/答题、几何模式；输出 自检报告.txt"""
import os, sys, json, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
OUT = []


def log(*a):
    line = ' '.join(str(x) for x in a)
    print(line)
    OUT.append(line)


def read_nodes():
    js = os.path.join(ROOT, 'nodes.js').replace(chr(92), '/')
    code = "global.window={};require('%s');console.log(JSON.stringify(window.NODES));" % js
    r = subprocess.run(['node', '-e', code], capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit('node 读取 nodes.js 失败: ' + r.stderr[:400])
    return json.loads(r.stdout)


def main():
    log('== 平行与垂直 · 智能体课堂 自检 ==')
    nodes = read_nodes()
    log('节点数', len(nodes), '页序', '连续' if [n['page'] for n in nodes] == list(range(1, 29)) else '不连续!')
    missing, bad = [], []
    for n in nodes:
        v = n.get('video')
        if not v:
            continue
        p = os.path.join(ROOT, v)
        if not os.path.isfile(p):
            missing.append((n['id'], v))
            continue
        r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type',
                            '-of', 'csv=p=0', p], capture_output=True, text=True)
        has_v = 'video' in r.stdout
        has_a = 'audio' in r.stdout
        if not has_v:
            bad.append((n['id'], v, 'no video stream'))
        elif n.get('type') != 'activity' and not has_a:
            bad.append((n['id'], v, 'no audio stream'))
    for name in ['B_yes_plate.mp4', 'C_no_plate.mp4']:
        if not os.path.isfile(os.path.join(ROOT, 'videos', name)):
            missing.append(('分支', name))
    log('视频引用', sum(1 for n in nodes if n.get('video')), '缺失', len(missing), '异常', len(bad))
    for x in missing:
        log('  缺失', *x)
    for x in bad:
        log('  异常', *x)
    geoms = [(n['id'], n['geom']) for n in nodes if n.get('geom')]
    log('几何层节点', geoms)
    quiz = [(n['id'], n['quiz']) for n in nodes if n.get('quiz')]
    log('答题页', quiz)
    log('几何层视频必须是「干净板」（无烘焙图形）：p13/p14/p18/p19 对应 videos/*_plate.mp4')
    log('== 结果：', '通过' if not missing and not bad else '有问题，请按上面清单修正', '==')
    open(os.path.join(ROOT, '自检报告.txt'), 'w', encoding='utf-8').write('\n'.join(OUT))


if __name__ == '__main__':
    main()
