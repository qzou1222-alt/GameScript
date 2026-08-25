import sys

from core import *

ind=0
def split_args(content):
    parts = []
    current = ""
    in_string = False

    for ch in content:
        if ch == '"':
            in_string = not in_string

        if ch == "," and not in_string:
            parts.append(current)
            current = ""
        else:
            current += ch

    parts.append(current)

    return parts
def parse_args(content):
    parts = split_args(content)

    values = []
    kwargs = {}

    for part in parts:
        part = part.strip()

        if "=" in part:
            name, value = part.split("=", 1)

            name = name.strip()
            value = value.strip()

            if (
                len(value) >= 2
                and value[0] == '"'
                and value[-1] == '"'
            ):
                value = value[1:-1]

            kwargs[name] = value

        else:
            if (
                len(part) >= 2
                and part[0] == '"'
                and part[-1] == '"'
            ):
                part = part[1:-1]

            values.append(part)

    return values, kwargs
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
                return j, f"Bracket Error: Unexpected bracket \"{ch}\""

            last, pos = stack.pop()

            if last != pairs[ch]:
                return j, f"Bracket Error: Expected \"{pairs[ch]}\" for \"{ch}\""

    if stack:
        ch, pos = stack[-1]
        return len(line), f"Bracket Error: Unclosed bracket \"{ch}\""

    return None

def execute_line(line:str):
    global ind
    ind+=1
    line=line.rstrip()
    if line.startswith(("#")):
        return
    error = checkBrackets(line)

    if error:
        pos, message = error

        printerr(
            f'{message}\n '
            f'in [line {ind}]\n '
            f'{line}\n '
            f'{" " * pos}^',
            fatal=True
        )

    if line.startswith("print("):
        if not line.endswith(")"):
            printerr(f"Syntax Error: Expected new line, found {line[line.find(")")+1:]} instead. \n in [line {ind}] \n {line} \n {" "*line.find(")")+"^"*(len(line)-line.find(")"))}",fatal=True)
        content = line[6:-1].strip()
    
        values, kwargs = parse_args(content)
    
        print(
            *values,
            printtype=kwargs.get("printtype", "message")
        )
    if line.startswith("printerr("):
        if not line.endswith(")"):
            printerr(f"Syntax Error: Expected new line, found {line[line.find(")")+1:]} instead. \n in [line {ind}] \n {line} \n {" "*line.find(")")+"^"*(len(line)-line.find(")"))}",fatal=True)
        content = line[9:-1].strip()
    
        values, kwargs = parse_args(content)
    
        printerr(
            " ".join(map(str, values)),
            fatal=kwargs.get("fatal", "false") == "true"
        )
    if line.startswith("printwarn("):
        if not line.endswith(")"):
            printerr(f"Syntax Error: Expected new line, found {line[line.find(")")+1:]} instead. \n in [line {ind}] \n {line} \n {" "*line.find(")")+"^"*(len(line)-line.find(")"))}",fatal=True)
        content = line[10:-1].strip()
    
        values, kwargs = parse_args(content)
    
        printwarn(
            " ".join(map(str, values)),
            fatal=kwargs.get("fatal", "false") == "true"
        )
    if line.startswith("versinfo("):
        if not line.endswith(")"):
            printerr(f"Syntax Error: Expected new line, found {line[line.find(")")+1:]} instead. \n in [line {ind}] \n {line} \n {" "*line.find(")")+"^"*(len(line)-line.find(")"))}",fatal=True)
        content = line[9:-1].strip()
    
        if content:
            printerr(f"Type Error: versinfo() does not support arguments. \n in [line {ind} \n {" "*10+"^"*(len(line)-line.find(")"))}]")
        versinfo()
def main():
    if len(sys.argv) < 2:
        printerr("Error: No GameScript file specified.")
        raise SystemExit(1)

    filename = sys.argv[1]

    try:
        with open(filename, "r", encoding="utf-8") as file:
            lines = file.read().splitlines()
    except FileNotFoundError:
        printerr(f'GameScript file "{filename}" does not exist.')
        raise SystemExit(1)

    for line in lines:
        execute_line(line)


if __name__ == "__main__":
    main()


