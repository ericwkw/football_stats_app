# Tool Usage Learnings

This document summarizes key learnings and best practices for using the available tools, particularly `default_api.replace` and `run_shell_command`, to avoid past errors.

## 1. `default_api.replace` Limitations:

- **Purpose:** This tool is designed for *exact, literal string replacements*. It is best suited for targeted, specific code modifications where the `old_string` can be uniquely identified.
- **Precision Required:** The `old_string` parameter must be an *exact literal match*, including all whitespace, indentation, and newlines. For single replacements, it requires at least 3 lines of context before and after the target text to ensure uniqueness.
- **Avoid for Broad Refactoring:** Do NOT use `default_api.replace` for broad, non-unique class name transformations (e.g., changing `bg-gray-50` to `bg-primary-bg` across an entire file) if those class names appear multiple times without unique surrounding context. This leads to failures due to non-unique matches or incorrect `expected_replacements` counts.

## 2. `run_shell_command` for Complex Python Logic:

- **Direct `default_api` Access:** Python scripts executed via `python -c '...'` within `run_shell_command` do NOT have direct access to `default_api` functions (like `read_file` or `write_file`). Attempting to import or call them will result in `NameError`.
- **Shell Escaping Complexity:** Embedding complex Python code (especially with string literals containing quotes or special characters) directly into `run_shell_command` using `python -c` is highly prone to shell escaping errors (`SyntaxError`).
- **Recommended Approach for Complex Transformations:** For robust, pattern-based string replacements across a file (e.g., changing multiple Tailwind classes), the most reliable method is to:
    1.  **Read the file content using a shell command:** Use `cat <file_path>` to get the file content.
    2.  **Perform all `re.sub` operations in memory:** Pipe the content to a `python3 -c` command that performs the regex replacements.
    3.  **Write the modified content back:** Redirect the output of the `python3 -c` command back to the original file using `> <file_path>`.
    -   Example: `cat <file_path> | python3 -c 'import sys, re; content = sys.stdin.read(); # perform re.sub operations; sys.stdout.write(content)' > <file_path>`

## 3. Atomic File Operations:

- **Principle:** For comprehensive file transformations, always read the entire file, perform all necessary modifications in memory, and then write the updated content back in a single, atomic operation.
- **Avoid Incremental `replace`:** Do NOT apply changes incrementally with multiple `default_api.replace` calls on the same file if those changes might affect the `old_string` of subsequent replacements. This leads to inconsistent file states and cascading errors.

## 4. Incremental Verification:

- **Build After Changes:** After each significant file modification or logical group of changes, immediately run `npm run build` to catch syntax errors early.
- **Visual Inspection:** Visually inspect the application (e.g., by running `npm run dev`) to confirm that styles are applied correctly and functionality is preserved.

By adhering to these principles, future development will be more precise, efficient, and less prone to repetitive errors.