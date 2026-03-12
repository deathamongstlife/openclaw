#!/usr/bin/env python3
"""
Advanced Rebranding Script: jarvis → jarvis
Handles complex patterns including:
- Case variations (Jarvis, jarvis, JARVIS)
- npm package names (@jarvis/*, jarvis/*)
- File paths and URLs
- Config keys and environment variables
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple
import argparse

# Color codes
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

# Replacement patterns (pattern, replacement, description)
REPLACEMENTS: List[Tuple[str, str, str]] = [
    # npm scoped packages
    (r'@jarvis/', '@jarvis/', 'npm scoped packages'),

    # Import paths
    (r'from ["\']jarvis/', 'from "jarvis/', 'import from jarvis'),
    (r'require\(["\']jarvis/', 'require("jarvis/', 'require jarvis'),

    # URLs and domains
    (r'https?://jarvis\.ai', 'https://jarvis.ai', 'jarvis.ai domains'),
    (r'https?://docs\.jarvis\.ai', 'https://docs.jarvis.ai', 'docs subdomain'),
    (r'https?://api\.jarvis\.ai', 'https://api.jarvis.ai', 'api subdomain'),

    # GitHub references
    (r'github\.com/deathamongstlife/jarvis', 'github.com/deathamongstlife/jarvis', 'GitHub repo'),
    (r'/deathamongstlife/jarvis', '/deathamongstlife/jarvis', 'GitHub paths'),

    # Environment variables (preserve case)
    (r'JARVIS_', 'JARVIS_', 'environment variables'),

    # Config paths
    (r'~/\.jarvis/', '~/.jarvis/', 'home config directory'),
    (r'\$HOME/\.jarvis/', '$HOME/.jarvis/', 'home config with variable'),
    (r'/\.jarvis/', '/.jarvis/', 'config directory'),

    # Binary and CLI names
    (r'\bjarvis-gateway\b', 'jarvis-gateway', 'gateway binary'),
    (r'\bjarvis-mac\b', 'jarvis-mac', 'mac binary'),
    (r'\bjarvis-cli\b', 'jarvis-cli', 'cli binary'),

    # General case variations (do these last)
    (r'\bJarvis\b', 'Jarvis', 'title case'),
    (r'\bjarvis\b', 'jarvis', 'lowercase'),
    (r'\bJARVIS\b', 'JARVIS', 'uppercase'),
    (r'\bopenClaw\b', 'jarvis', 'camelCase'),
]

# Files to skip (binary, build artifacts, etc.)
SKIP_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
    '.woff', '.woff2', '.ttf', '.eot',
    '.zip', '.tar', '.gz', '.bz2', '.xz',
    '.pdf', '.dylib', '.so', '.a', '.node',
    '.pyc', '.pyo', '.egg-info',
    '.lock', '.log',
}

SKIP_DIRECTORIES = {
    'node_modules', '.git', '.pnpm', 'dist', 'build',
    'coverage', '.next', 'target', '.turbo', '__pycache__',
    '.pytest_cache', '.venv', 'venv',
}

class Rebrander:
    def __init__(self, root_dir: Path, dry_run: bool = True, verbose: bool = False):
        self.root_dir = root_dir
        self.dry_run = dry_run
        self.verbose = verbose
        self.files_changed = 0
        self.total_replacements = 0
        self.changes_by_pattern = {desc: 0 for _, _, desc in REPLACEMENTS}

    def should_skip_file(self, file_path: Path) -> bool:
        """Check if file should be skipped"""
        # Check extension
        if file_path.suffix.lower() in SKIP_EXTENSIONS:
            return True

        # Check if in skip directory
        for part in file_path.parts:
            if part in SKIP_DIRECTORIES:
                return True

        # Check if binary
        try:
            with open(file_path, 'rb') as f:
                chunk = f.read(8192)
                if b'\x00' in chunk:  # Binary file
                    return True
        except Exception:
            return True

        return False

    def rebrand_file(self, file_path: Path) -> int:
        """Rebrand a single file, return number of changes"""
        if self.should_skip_file(file_path):
            return 0

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except (UnicodeDecodeError, PermissionError):
            return 0

        original_content = content
        file_changes = 0

        # Apply all replacement patterns
        for pattern, replacement, description in REPLACEMENTS:
            matches = len(re.findall(pattern, content))
            if matches > 0:
                content = re.sub(pattern, replacement, content)
                file_changes += matches
                self.changes_by_pattern[description] += matches

                if self.verbose:
                    print(f"  [{description}] {matches} matches")

        # Write changes if content modified
        if content != original_content:
            if self.dry_run:
                print(f"{Colors.YELLOW}[DRY RUN]{Colors.NC} Would change: {file_path.relative_to(self.root_dir)} ({file_changes} replacements)")
            else:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"{Colors.GREEN}✓{Colors.NC} Changed: {file_path.relative_to(self.root_dir)} ({file_changes} replacements)")

            self.files_changed += 1
            self.total_replacements += file_changes
            return file_changes

        return 0

    def scan_and_rebrand(self):
        """Scan all files and apply rebranding"""
        print("═" * 60)
        print("  Jarvis → Jarvis Advanced Rebranding")
        print("═" * 60)
        print(f"Repository: {self.root_dir}")
        print(f"Dry run: {self.dry_run}")
        print(f"Verbose: {self.verbose}")
        print()
        print("Scanning for files to rebrand...")
        print()

        # Walk directory tree
        for file_path in self.root_dir.rglob('*'):
            if file_path.is_file():
                self.rebrand_file(file_path)

        self.print_summary()

    def print_summary(self):
        """Print summary of changes"""
        print()
        print("═" * 60)
        print("  Rebranding Summary")
        print("═" * 60)
        print(f"Files changed: {self.files_changed}")
        print(f"Total replacements: {self.total_replacements}")
        print()

        if self.total_replacements > 0:
            print("Changes by pattern:")
            for description, count in sorted(self.changes_by_pattern.items(), key=lambda x: -x[1]):
                if count > 0:
                    print(f"  {description}: {count}")

        print()

        if self.dry_run:
            print(f"{Colors.YELLOW}This was a dry run. No files were modified.{Colors.NC}")
            print("To apply changes, run with: --no-dry-run")
        else:
            print(f"{Colors.GREEN}Rebranding complete!{Colors.NC}")
            print()
            print("Next steps:")
            print("1. Review changes: git diff")
            print("2. Test the build: pnpm build")
            print("3. Run tests: pnpm test")
            print("4. Commit changes: git add . && git commit -m 'Rebrand: jarvis → jarvis'")

        print()
        print("═" * 60)

def main():
    parser = argparse.ArgumentParser(
        description='Advanced rebranding script: jarvis → jarvis'
    )
    parser.add_argument(
        'root_dir',
        nargs='?',
        default='.',
        help='Root directory to process (default: current directory)'
    )
    parser.add_argument(
        '--no-dry-run',
        action='store_true',
        help='Actually modify files (default: dry run)'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Verbose output'
    )

    args = parser.parse_args()

    root_dir = Path(args.root_dir).resolve()
    if not root_dir.exists():
        print(f"{Colors.RED}Error: Directory {root_dir} does not exist{Colors.NC}")
        sys.exit(1)

    rebrander = Rebrander(
        root_dir=root_dir,
        dry_run=not args.no_dry_run,
        verbose=args.verbose
    )

    rebrander.scan_and_rebrand()

if __name__ == '__main__':
    main()
