import subprocess
import time
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
WAIT_SECONDS = 3

IGNORE = {
    ".git",
    "__pycache__",
    "node_modules",
    ".venv",
    "venv",
}

def run_git(command):
    subprocess.run(
        command,
        cwd=PROJECT_DIR,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

def has_changes():
    result = subprocess.run(
        "git status --porcelain",
        cwd=PROJECT_DIR,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    return bool(result.stdout.strip())

print("🚀 Auto Git Commit & Push is running...")
print("Press Ctrl+C to stop.")

last_commit = ""

while True:
    try:
        if has_changes():
            time.sleep(WAIT_SECONDS)

            if has_changes():
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                message = f"Auto commit: {timestamp}"

                print(f"📦 Changes detected → {message}")

                run_git("git add .")
                run_git(f'git commit -m "{message}"')
                run_git("git push")

                print("✅ Committed and pushed to GitHub")

        time.sleep(2)

    except KeyboardInterrupt:
        print("\n🛑 Auto Git stopped.")
        break