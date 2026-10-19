# -*- coding: utf-8 -*-
"""带 Range 的静态服务器：<video> 拖动/首帧解码需要 206。"""
import http.server, socketserver, os, sys, functools

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        rng = self.headers.get('Range')
        if not rng or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        try:
            unit, r = rng.split('=', 1)
            a, b = r.split('-', 1)
            start = int(a) if a else 0
            end = int(b) if b else size - 1
        except Exception:
            return super().send_head()
        end = min(end, size - 1)
        if start > end:
            self.send_error(416)
            return None
        f = open(path, 'rb')
        f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        return _Slice(f, end - start + 1)


class _Slice:
    def __init__(self, f, n):
        self.f, self.n = f, n

    def read(self, k=-1):
        if self.n <= 0:
            return b''
        k = self.n if k < 0 else min(k, self.n)
        data = self.f.read(k)
        self.n -= len(data)
        return data

    def close(self):
        self.f.close()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


if __name__ == '__main__':
    os.chdir(ROOT)
    with Server(('127.0.0.1', PORT), functools.partial(Handler, directory=ROOT)) as httpd:
        print(f'http://127.0.0.1:{PORT}/index.html')
        httpd.serve_forever()
