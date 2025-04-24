# Peter's Guide to Software Development Foundations

This guide summarizes the key concepts and tools we've discussed to help you establish a strong foundation in software development.

## 1. Setting Up a GitHub Account

### Why GitHub?

GitHub is a platform for version control and collaboration, essential for modern software development.

### Steps:

1.  **Go to GitHub:** Navigate to [github.com](https://github.com/) in your web browser.
2.  **Sign Up:** Click the "Sign up" button.
3.  **Enter Details:** Provide your email address, create a strong password, and choose a unique username.
4.  **Verify Account:** Follow any verification steps (e.g., CAPTCHA, email verification).
5.  **Profile Setup:** Add a profile picture, write a short bio, and include any relevant links.

## 2. Essential Git Commands

Git is a version control system that tracks changes to your code.

### Core Commands:

1.  **`git init`:** Initializes a new Git repository in the current directory.

    ```bash
    git init
    ```

2.  **`git clone <repository_url>`:** Copies a remote Git repository to your local machine.

    ```bash
    git clone <repository_url>
    ```

3.  **`git status`:** Shows the current status of the working directory.

    ```bash
    git status
    ```

4.  **`git add <file>` or `git add .`:** Stages changes for the next commit.

    ```bash
    git add <filename>  # To add a specific file
    git add .           # To add all modified and new files
    ```

5.  **`git commit -m "Your descriptive message"`:** Creates a new commit (snapshot) of the staged changes.

    ```bash
    git commit -m "Your descriptive message"
    ```

6.  **`git push origin main`:** Uploads local commits to the remote repository.

    ```bash
    git push origin main
    ```

7.  **`git pull origin main`:** Downloads changes from the remote repository to your local machine and merges them into your current branch.

    ```bash
    git pull origin main
    ```

## 3. Git Installation and Setup on macOS

1.  **Install Homebrew (if not already installed):**

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```

    Follow the on-screen instructions, including adding Homebrew to your PATH.

2.  **Install Git using Homebrew:**

    ```bash
    brew install git
    ```

3.  **Verify the Installation:**

    ```bash
    git --version
    ```

4.  **Configure Git:**

    ```bash
    git config --global user.name "Your Name"
    git config --global user.email "your.email@example.com"
    git config --list # Verify the configuration
    ```

## 4. Installing and Setting Up Cursor

Cursor is a powerful IDE that provides AI assistance and enhances the coding experience.

1.  **Download Cursor:** Go to [https://www.cursor.sh/](https://github.com/) and download the macOS version.
2.  **Open the Downloaded File:** Double-click the `.dmg` file.
3.  **Drag Cursor to Applications Folder:** Drag the Cursor icon to the Applications folder.
4.  **Launch Cursor:** Open the Applications folder and double-click the Cursor icon.
5.  **Sign In/Create Account:** Follow the on-screen instructions to sign in or create an account.
6.  **Configure Theme and Preferences:** Customize the theme, font, and keybindings in the settings.

## 5. Essential Python Extensions for Cursor

1.  **Python (by Microsoft):** Provides IntelliSense, linting, debugging, and code formatting.
2.  **Pylance (by Microsoft):** Enhances IntelliSense with type checking and advanced code completion.
3.  **Black Formatter:** Automatically formats your code to adhere to a consistent style. (Install with `pip install black`).
4.  **Pylint:** Analyzes your code for potential errors and style issues. (Install with `pip install pylint`).
5.  **autoDocstring:** Simplifies generating docstrings for Python functions and classes.

### Installing Extensions:

1.  Open the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
2.  Search for the extension by name.
3.  Click "Install".

## 6. Good Programming Practices

### DRY (Don't Repeat Yourself):

Avoid duplicating code by extracting it into functions, loops, constants, or templates.

**Example (Python):**

```python
# Bad (Repeating code)
def calculate_area_rectangle(length, width):
    area = length * width
    print(f"The area of the rectangle is: {area}")

def calculate_perimeter_rectangle(length, width):
    perimeter = 2 * (length + width)
    print(f"The perimeter of the rectangle is: {perimeter}")

# Good (Using a function to avoid repetition)
def calculate_rectangle_stats(length, width):
    area = length * width
    perimeter = 2 * (length + width)
    print(f"The area of the rectangle is: {area}")
    print(f"The perimeter of the rectangle is: {perimeter}")

SOLID Principles:
SOLID is an acronym for five design principles to make software designs more understandable, flexible, and maintainable.

S - Single Responsibility Principle (SRP): A class should have only one reason to change.
O - Open/Closed Principle (OCP): Software entities should be open for extension but closed for modification.
L - Liskov Substitution Principle (LSP): Subtypes should be substitutable for their base types.
I - Interface Segregation Principle (ISP): Clients should not be forced to depend on methods they do not use.
D - Dependency Inversion Principle (DIP): High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions.
7. Additional Important Practices
Code Readability & Style: Follow PEP 8 guidelines for consistent code style. Use tools like flake8 and autopep8. Write effective comments.
Error Handling: Use try...except blocks to handle exceptions gracefully. Catch specific exceptions rather than using a generic except block. Consider logging errors.
Testing Fundamentals: Understand the importance of testing. Write basic unit tests using the unittest module or the pytest framework.
Dependency Management: Use pip (Python Package Installer) to install and manage external libraries and dependencies. Create a requirements.txt file to specify the project's dependencies. Strongly recommend using virtual environments (using venv or virtualenv) to isolate project dependencies.
Debugging Techniques: Use print statements to debug code by inspecting the values of variables. Introduce the built-in Python debugger (pdb) or the debugging features in Cursor.
Version Control Etiquette: Write clear and concise commit messages that explain the purpose of each commit. Commit changes frequently, rather than making large, infrequent commits. Avoid committing sensitive information (e.g., passwords, API keys) to the repository.

8. Installing and Setting Up uv
uv is a fast and modern Python package installer.

Install Rust:

bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
Install uv using Cargo:

bash
cargo install uv
Verify the Installation:

bash
uv --version
Using uv Commands:
bash
uv venv .venv              # Create a virtual environment
source .venv/bin/activate  # Activate (Unix)
.venv\Scripts\activate      # Activate (Windows)
uv pip install <package>    # Install a package


I want to create a new Python project named "MyProject".

1.  Create a new, empty repository on GitHub named "MyProject" under my account (my GitHub username is <Peter's GitHub Username>). Make it a public repository and add a basic README.md file with the project title as a level 1 heading, and a short description of the project.

2.  Clone the newly created GitHub repository to a local directory named "MyProject" on my computer (ideally in my "Development" folder).

3.  Navigate into the "MyProject" directory in the terminal.

4.  Initialize a new Python virtual environment using uv in a directory called `.venv`.

5.  Activate the virtual environment.

6.  Create a basic "main.py" file in the "MyProject" directory with a simple "Hello, world!" program.

7.  Add the `.venv` directory to a `.gitignore` file to prevent committing the virtual environment.

8.  Add the main.py file to git, commit it with the message "Initial commit: Hello, world!", and push it to the remote GitHub repository.
