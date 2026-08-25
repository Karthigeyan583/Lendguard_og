import subprocess
import time
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path(__file__).resolve().parent
WAIT_SECONDS = 4

# Files/folders that should NOT trigger commits
IGNORED = {
    ".git",
    ".env",
    ".venv",
    "venv",
    "__pycache__",
    "node_modules",
    ".DS_Store",
    "dist",
    "build",
    "coverage",
    ".pytest_cache",
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


def get_git_status_and_changes():
    status_output, _ = run_git("git status --porcelain")
    if not status_output:
        return [], [], ""

    files = []
    status_lines = []

    for line in status_output.splitlines():
        if not line.strip():
            continue

        status_code = line[:2]
        file_path = line[3:].strip()

        # Handle renamed files (e.g. old_name -> new_name)
        if " -> " in file_path:
            file_path = file_path.split(" -> ")[-1]

        parts = Path(file_path).parts
        if any(part in IGNORED for part in parts):
            continue

        files.append(file_path)
        status_lines.append(line)

    # Capture diff snippet for semantic commit analysis
    diff_output, _ = run_git("git diff HEAD")
    if not diff_output:
        diff_output, _ = run_git("git diff")

    return files, status_lines, diff_output


def generate_commit_message(files, diff_text="", status_lines=None):
    if not files:
        return None

    if status_lines is None:
        status_lines = []

    # 1. Map scopes with weights based on modified files
    scope_weights = {}

    def add_scope(scope, weight=1):
        scope_weights[scope] = scope_weights.get(scope, 0) + weight

    for f in files:
        f_lower = f.lower()
        if "dashboard" in f_lower:
            add_scope("dashboard", 4)
        elif "people" in f_lower or "person" in f_lower:
            add_scope("people", 4)
        elif "loan" in f_lower or "ledger" in f_lower:
            add_scope("loans", 4)
        elif "payment" in f_lower:
            add_scope("payments", 4)
        elif "aging" in f_lower or "report" in f_lower:
            add_scope("reports", 4)
        elif "statement" in f_lower or "iou" in f_lower:
            add_scope("statements", 4)
        elif "auth" in f_lower or "login" in f_lower:
            add_scope("auth", 4)
        elif "reminder" in f_lower or "alert" in f_lower or "notification" in f_lower:
            add_scope("reminders", 4)
        elif "calculator" in f_lower:
            add_scope("calculator", 4)
        elif "header" in f_lower or "sidebar" in f_lower or "topbar" in f_lower or "navbar" in f_lower:
            add_scope("navigation", 3)
        elif "api" in f_lower or "service" in f_lower:
            add_scope("api", 3)
        elif f.endswith(".css") or "style" in f_lower:
            add_scope("ui", 3)
        elif "test" in f_lower:
            add_scope("test", 3)
        elif f.endswith(".md"):
            add_scope("docs", 3)
        elif "auto_git" in f_lower:
            add_scope("git-sync", 4)
        elif "backend" in f_lower or f.endswith(".py"):
            add_scope("backend", 1)
        elif "frontend" in f_lower or f.endswith((".jsx", ".js", ".tsx", ".ts", ".html")):
            add_scope("frontend", 1)
        else:
            add_scope("core", 1)

    primary_scope = max(scope_weights, key=scope_weights.get) if scope_weights else "app"

    # 2. Analyze action and intent
    diff_lower = diff_text.lower()
    is_new = any(line.startswith("??") or line.startswith("A ") for line in status_lines)
    is_deleted = any(" D " in line or line.startswith("D ") for line in status_lines)

    stems = [Path(f).stem for f in files if Path(f).stem != "auto_git"]
    if not stems:
        stems = [Path(f).stem for f in files]

    if len(stems) == 1:
        file_summary = stems[0]
    elif len(stems) <= 2:
        file_summary = ", ".join(stems)
    else:
        file_summary = f"{', '.join(stems[:2])} and {len(stems) - 2} other files"

    # 3. Determine commit type and clear descriptive summary
    if any(k in diff_lower for k in ["hardcoded", "mock", "initial_loans", "initial_people", "fallback", "210000", "140000", "70000"]):
        commit_type = "refactor"
        desc = f"remove hardcoded mock data and integrate live backend metrics in {file_summary}"
    elif any(k in diff_lower for k in ["hover", "animation", "glow", "glass", "color", "shadow", "gradient", "transition", "transform"]) and any(f.endswith((".css", ".jsx", ".html")) for f in files):
        commit_type = "style" if primary_scope == "ui" else "feat"
        desc = f"enhance UI styling, card animations, and visual layout in {file_summary}"
    elif any(k in diff_lower for k in ["fix", "bug", "error", "null", "undefined", "exception", "disallowedhost", "invalid"]):
        commit_type = "fix"
        desc = f"fix calculation and data handling edge cases in {file_summary}"
    elif is_new:
        commit_type = "feat"
        desc = f"add {file_summary} component and functionality"
    elif is_deleted:
        commit_type = "refactor"
        desc = f"remove unused files ({file_summary})"
    elif primary_scope == "docs":
        commit_type = "docs"
        desc = f"update documentation, walkthroughs, and development guides"
    elif primary_scope == "git-sync":
        commit_type = "chore"
        desc = "enhance auto-commit description generation with semantic conventional commits"
    elif primary_scope in ["loans", "payments", "statements"]:
        commit_type = "feat"
        desc = f"update financial ledger logic and data processing in {file_summary}"
    elif primary_scope == "reports":
        commit_type = "feat"
        desc = f"update overdue aging analytics and report tier calculation in {file_summary}"
    elif primary_scope == "dashboard":
        commit_type = "feat"
        desc = f"update dashboard KPI indicators and real-time portfolio metrics in {file_summary}"
    elif primary_scope == "people":
        commit_type = "feat"
        desc = f"update contact exposure and borrower directory management in {file_summary}"
    elif primary_scope == "auth":
        commit_type = "feat"
        desc = f"update authentication, user profile, and session handling in {file_summary}"
    elif primary_scope == "navigation":
        commit_type = "feat"
        desc = f"update navigation panels, top header, and workspace switcher in {file_summary}"
    elif primary_scope == "calculator":
        commit_type = "feat"
        desc = f"update loan EMI calculator and simulation terms in {file_summary}"
    elif primary_scope == "api":
        commit_type = "feat"
        desc = f"update API client endpoints and data services in {file_summary}"
    elif primary_scope == "ui":
        commit_type = "style"
        desc = f"update design system tokens, typography, and responsive styles in {file_summary}"
    else:
        commit_type = "feat"
        desc = f"update {file_summary} implementation"

    return f"{commit_type}({primary_scope}): {desc}"


def main():
    print("=" * 60)
    print("🚀 LendGuard Intelligent Auto Git Watcher & Pusher")
    print(f"📁 Watching Directory: {PROJECT_DIR}")
    print("✨ Generates Semantic Conventional Commit Descriptions")
    print("Press Ctrl+C to stop.")
    print("=" * 60 + "\n")

    while True:
        try:
            changed_files, status_lines, diff_text = get_git_status_and_changes()

            if changed_files:
                # Debounce to let multi-file saves settle
                time.sleep(WAIT_SECONDS)
                changed_files, status_lines, diff_text = get_git_status_and_changes()

                if changed_files:
                    commit_message = generate_commit_message(changed_files, diff_text, status_lines)
                    timestamp = datetime.now().strftime("%H:%M:%S")

                    print(f"\n[{timestamp}] 📦 Changes detected ({len(changed_files)} files):")
                    for f in changed_files:
                        print(f"   • {f}")

                    print(f"📝 Commit Message: {commit_message}")

                    run_git("git add -A")

                    escaped_msg = commit_message.replace('"', '\\"')
                    output, error = run_git(f'git commit -m "{escaped_msg}"')

                    if "nothing to commit" not in output.lower():
                        print("✅ Local commit created successfully.")

                        push_output, push_error = run_git("git push")
                        if push_error and "error" in push_error.lower():
                            print("⚠️ Git push notice/error:")
                            print(push_error)
                        else:
                            print("🚀 Successfully pushed commit to GitHub.")

                    print("-" * 60)
                    # Brief cooldown to avoid immediate duplicate triggers
                    time.sleep(4)

            time.sleep(2)

        except KeyboardInterrupt:
            print("\n🛑 Auto Git stopped gracefully.")
            break
        except Exception as e:
            print(f"⚠️ Error during auto-git cycle: {e}")
            time.sleep(3)


if __name__ == "__main__":
    main()