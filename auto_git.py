import subprocess
import time
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path(__file__).resolve().parent
WAIT_SECONDS = 5

# Files/folders that should NOT trigger commits
IGNORED = {
    ".git",
    ".env",
    ".venv",
    "venv",
    "__pycache__",
    "node_modules",
    ".DS_Store",
}

def run_git(command):
    result = subprocess.run(
        command,
        cwd=PROJECT_DIR,
        shell=True,
        capture_output=True,
        text=True
    )
    return result.stdout.strip(), result.stderr.strip()


def get_changed_files():
    output, _ = run_git("git status --porcelain")

    files = []

    for line in output.splitlines():
        if not line:
            continue

        # Git status format: XY filename
        file_path = line[3:].strip()

        # Handle renamed files
        if " -> " in file_path:
            file_path = file_path.split(" -> ")[-1]

        parts = Path(file_path).parts

        if any(part in IGNORED for part in parts):
            continue

        files.append(file_path)

    return files


def generate_commit_message(files):
    if not files:
        return None

    names = [Path(f).name for f in files]

    # Try to identify the type of change
    extensions = [Path(f).suffix.lower() for f in files]

    if any("test" in f.lower() for f in files):
        prefix = "Test"
    elif any(ext in [".html", ".css", ".js", ".dart"] for ext in extensions):
        prefix = "UI"
    elif any(ext in [".py"] for ext in extensions):
        prefix = "Backend"
    elif any(ext in [".json", ".yaml", ".yml"] for ext in extensions):
        prefix = "Config"
    else:
        prefix = "Update"

    if len(names) == 1:
        description = names[0]
    elif len(names) <= 3:
        description = ", ".join(names)
    else:
        description = f"{len(names)} files"

    return f"{prefix}: Updated {description}"


print("🚀 Auto Git Commit & Push is running...")
print("Watching:", PROJECT_DIR)
print("Press Ctrl+C to stop.\n")

while True:

    try:
        changed_files = get_changed_files()

        if changed_files:

            # Wait until changes settle
            time.sleep(WAIT_SECONDS)

            changed_files = get_changed_files()

            if changed_files:

                commit_message = generate_commit_message(changed_files)

                print("\n📦 Changes detected:")
                for file in changed_files:
                    print(f"   • {file}")

                print(f"\n📝 Commit: {commit_message}")

                run_git("git add .")

                commit_command = f'git commit -m "{commit_message}"'
                output, error = run_git(commit_command)

                if "nothing to commit" not in output.lower():
                    print("✅ Commit created")

                    push_output, push_error = run_git("git push")

                    if push_error:
                        print("⚠️ Push error:")
                        print(push_error)
                    else:
                        print("🚀 Successfully pushed to GitHub")

                print()

                # Prevent immediate duplicate detection
                time.sleep(5)

        time.sleep(2)

    except KeyboardInterrupt:
        print("\n🛑 Auto Git stopped.")
        break
    