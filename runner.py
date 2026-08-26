import sys
import types
from core import *
from core import _BoolHumanRead, _NoneType
variables = {}
ind = 0
functions:dict[str,types.FunctionType] = {
    "print": print,
    "printerr": printerr,
    "printwarn": printwarn,
    "printinfo": printinfo,
    "printbash": printbash,
    "versinfo": versinfo,
    "input": input,
    "is_integer": is_integer,
    "is_float":is_float
}
def find_assignment(line):
    in_string = False
    depth = 0
    for i, ch in enumerate(line):
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif ch == "=" and depth == 0:
            return i
    return -1
def split_args(content):
    parts = []
    current = ""
    in_string = False
    depth = 0
    for ch in content:
        if ch == '"':
            in_string = not in_string
        if not in_string:
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
        if ch == "," and not in_string and depth == 0:
            parts.append(current.strip())
            current = ""
        else:
            current += ch
    if current.strip():
        parts.append(current.strip())
    return parts
def parse_args(content):
    parts = split_args(content)
    values = []
    kwargs = {}
    for part in parts:
        part = part.strip()
        assignment = find_assignment(part)
        if assignment != -1:
            name = part[:assignment].strip()
            value = part[assignment + 1:].strip()
            kwargs[name] = evaluate(value)
        else:
            values.append(evaluate(part))
    return values, kwargs
def evaluate(expression: str):
    expression = expression.strip()
    if expression == "":
        return None
    # String
    if (
        len(expression) >= 2
        and expression[0] == '"'
        and expression[-1] == '"'
    ):
        return expression[1:-1]
    else:
        if is_integer(expression, False):
            return int(expression)
        if is_float(expression):
            return float(expression)
        if expression in {"true","false"}:
            b=True if expression=="true" else False
            return _BoolHumanRead(b=b)
        if expression == "none":
            return _NoneType()
    # Variable
    if expression in variables:
        return variables[expression]
    # Built-in function call
    if expression.endswith(")"):
        open_index = expression.find("(")
        if open_index != -1:
            name = expression[:open_index].strip()
            # Make sure this really looks like a function call
            if name in functions:
                content = expression[
                    open_index + 1:-1
                ]
                values, kwargs = parse_args(content)
                function = functions[name]
                try:
                    result = function(
                    *values,
                    **kwargs
                    )

                    if isinstance(result, bool):
                        return _BoolHumanRead(result)
                    if result is None:
                        return _NoneType()
                    return result
                except TypeError as error:
                    printerr(
                        f"Type Error: {error}",
                        fatal=True
                    )
    # Unknown expression
    return expression
def checkBrackets(line):
    stack = []
    pairs = {
        ")": "(",
        "]": "[",
        "}": "{"
    }
    opens = ["(", "[", "{"]

    for j in range(len(line)):
        ch = line[j]

        if ch in opens:
            stack.append((ch, j))

        elif ch in pairs:
            if not stack:
                return (
                    j,
                    f'Bracket Error: Unexpected bracket "{ch}"'
                )

            last, pos = stack.pop()

            if last != pairs[ch]:
                return (
                    j,
                    f'Bracket Error: Expected "{pairs[ch]}" '
                    f'for "{ch}"'
                )

    if stack:
        ch, pos = stack[-1]

        return (
            len(line),
            f'Bracket Error: Unclosed bracket "{ch}"'
        )

    return None


def execute_line(line: str):
    global ind

    ind += 1

    line = line.rstrip()

    if not line.strip():
        return

    if line.lstrip().startswith("#"):
        return

    error = checkBrackets(line)

    if error:
        pos, message = error

        printerr(
            f'{message}\n'
            f' in [line {ind}]\n'
            f' {line}\n'
            f' {" " * pos}^',
            fatal=True
        )

    assignment = find_assignment(line)

    if assignment != -1:
        name = line[:assignment].strip()
        value = line[assignment + 1:].strip()

        if not name:
            printerr(
                f"Syntax Error: Expected variable name.\n"
                f" in [line {ind}]\n"
                f" {line}",
                fatal=True
            )

        
        variables[name] = evaluate(value)
        return

    # Normal expression / builtin call
    evaluate(line)


def main():
    if len(sys.argv) < 2:
        printerr(
            "Error: No GameScript file specified.",
            fatal=True
        )

    filename = sys.argv[1]

    try:
        with open(
            filename,
            "r",
            encoding="utf-8"
        ) as file:
            lines = file.read().splitlines()

    except FileNotFoundError:
        printerr(
            f'GameScript file "{filename}" does not exist.',
            fatal=True
        )

    for line in lines:
        execute_line(line)


if __name__ == "__main__":
    main()