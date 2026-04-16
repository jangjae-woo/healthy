#!/usr/bin/env python3
"""
사주 사이트 Claude Max 릴레이 서버
Claude Code CLI를 통해 Max 플랜으로 요청을 처리합니다.
포트: 3457

실행 방법:
  python relay_server.py

종료:
  Ctrl+C
"""
import sys
import io
import json
import subprocess
import os
import tempfile
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

PORT = 3457


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    """요청마다 새 스레드 — 동시 요청 가능"""
    daemon_threads = True


class RelayHandler(BaseHTTPRequestHandler):

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length)
            body = json.loads(raw.decode('utf-8'))
            prompt = body.get('prompt', '')

            print(f"[요청] 프롬프트 {len(prompt)}자 처리 중...")

            result_text = run_claude(prompt)

            print(f"[완료] 결과 {len(result_text)}자")

            response = json.dumps({'result': result_text}, ensure_ascii=False)
            encoded = response.encode('utf-8')

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)

        except Exception as e:
            print(f"[오류] {e}")
            response = json.dumps({'error': str(e)}).encode('utf-8')
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response)))
            self.end_headers()
            self.wfile.write(response)

    def log_message(self, fmt, *args):
        pass  # 기본 HTTP 로그 숨김


def run_claude(prompt: str) -> str:
    """
    claude CLI를 통해 프롬프트 실행 후 결과 반환.
    프롬프트를 임시 파일로 저장해 인코딩 문제 방지.
    """
    # 임시 파일에 프롬프트 저장 (긴 프롬프트 + 한글 안전 처리)
    tmp = None
    try:
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.txt', delete=False, encoding='utf-8'
        ) as f:
            f.write(prompt)
            tmp = f.name

        if sys.platform == 'win32':
            # Windows: type 명령으로 stdin 파이프
            cmd = f'type "{tmp}" | claude -p'
        else:
            cmd = f'cat "{tmp}" | claude -p'

        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            timeout=180,
            encoding='utf-8',
            errors='replace',
        )

        if result.returncode != 0 and result.stderr:
            print(f"[경고] stderr: {result.stderr[:200]}")

        return result.stdout.strip()

    finally:
        if tmp and os.path.exists(tmp):
            try:
                os.unlink(tmp)
            except Exception:
                pass


if __name__ == '__main__':
    server = ThreadingHTTPServer(('localhost', PORT), RelayHandler)
    print(f"╔══════════════════════════════════════╗")
    print(f"║  Claude Max 릴레이 서버 시작          ║")
    print(f"║  http://localhost:{PORT}               ║")
    print(f"║  종료: Ctrl+C                        ║")
    print(f"╚══════════════════════════════════════╝")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[릴레이] 서버 종료")
