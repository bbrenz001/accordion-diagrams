"""
Accordion Diagrams — desktop launcher.
Uses pywebview to open the HTML app in a native desktop window.
"""
import os
import sys
import json
import webview

APP_DIR   = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')
INDEX     = os.path.join(APP_DIR, 'index.html')
DATA_FILE = os.path.join(APP_DIR, 'user_data.json')

if not os.path.exists(INDEX):
    print(f'ERROR: index.html not found at {INDEX}')
    sys.exit(1)


class Api:
    def load_data(self):
        try:
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    return f.read()
        except Exception as e:
            print(f'load_data error: {e}')
        return '{}'

    def save_data(self, json_str):
        try:
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                f.write(json_str)
            return True
        except Exception as e:
            print(f'save_data error: {e}')
            return False

    def backup_data(self):
        import shutil
        from datetime import datetime
        try:
            if not os.path.exists(DATA_FILE):
                return None
            backup_dir = os.path.join(os.path.dirname(DATA_FILE), 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            ts  = datetime.now().strftime('%Y%m%d_%H%M%S')
            dst = os.path.join(backup_dir, f'user_data_{ts}.json')
            shutil.copy2(DATA_FILE, dst)
            return dst
        except Exception as e:
            print(f'backup_data error: {e}')
            return None


api = Api()

window = webview.create_window(
    title='Diagrama de Acordeón',
    url=f'file:///{INDEX.replace(os.sep, "/")}',
    js_api=api,
    width=1100,
    height=680,
    min_size=(800, 560),
    resizable=True,
)

webview.start(debug=False)
