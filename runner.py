import sys
import types
from core import *
from core import _BoolHumanRead, _NoneType
variables = {"NaN": float("nan"), "FileSystem.tempfolder": tempfolder}
ind = 0
functions:dict[str,types.FunctionType] = {
    "print": print,
    "printerr": printerr,
    "printwarn": printwarn,
    "printinfo": printinfo,
    "printbash": printbash,
    "printfinish": printfinish,
    "versinfo": versinfo,
    "input": input,
    "is_integer": is_integer,
    "is_float":is_float,
    "sum": sum,
    "sub": sub,
    "mul": mul,
    "div": div,
    "String.join": strjoin,
    "String.repeat": strrepeat,
    "String.upper": strupper,
    "String.lower": strlower,
    "String.length": strlen,
    "String.contains": strcontains,
    "playscript": playscript,
    "Type": Type,
    "Type.is_instance": typeisinstance,
    "Boolean": Boolean,
    "String": String,
    "FileSystem.open_folder": folderopen,
    "FileSystem.exists": fileorfolderexists,
    "FileSystem.file_exists": fileexists,
    "FileSystem.folder_exists": folderexists,
    "FileSystem.add_file_to_folder": folderaddfile,
    "FileSystem.write_to_file": filewrite,
    "FileSystem.read_file": fileread,
    "FileSystem.append_to_file": fileappend,
    "FileSystem.Folder.open": folderopen,
    "FileSystem.Folder.exists": folderexists,
    "FileSystem.Folder.add_file": folderaddfile,
    "FileSystem.File.exists": fileexists,
    "FileSystem.File.write": filewrite,
    "FileSystem.File.store": filewrite,
    "FileSystem.File.read": fileread,
    "FileSystem.File.append": fileappend
}
def find_colon(expression: str):
    depth = 0
    in_string = False

    for i, ch in enumerate(expression):
        if ch == '"':
            in_string = not in_string
            continue

        if in_string:
            continue

        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif ch == ":" and depth == 0:
            return i

    return -1
def find_attribute_dot(expression: str):
    depth = 0
    in_string = False

    for i, ch in enumerate(expression):
        if ch == '"':
            in_string = not in_string
            continue

        if in_string:
            continue

        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif ch == "." and depth == 0:
            return i

    return -1
def find_matching_bracket(expression: str, opening_index: int):
    depth = 0
    in_string = False

    for i in range(opening_index, len(expression)):
        ch = expression[i]

        if ch == '"':
            in_string = not in_string
            continue

        if in_string:
            continue

        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1

            if depth == 0:
                return i

    return -1
def get_attribute(obj, attribute):
    obj_type = Type(obj)
    cls=obj_type.type.cls
    match cls:
        case "Boolean":
            match attribute:
                case _:
                    pass

        case "String":
            match attribute:
                case "length":
                    return String(obj)._get_length()
                case "as_upper":
                    return strupper(String(obj).string)
                case "as_lower":
                    return strlower(String(obj).string)
        case "Integer":
            match attribute:
                case _:
                    pass

    return UnknownType()
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
    if (
        len(expression) >= 2
        and expression[0] == '"'
        and expression[-1] == '"'
    ):
        expression.replace("\\n","\n")
        return expression[1:-1]
    else:
        if expression in variables:
            return variables[expression]
        if expression in functions:
            return Function(functions[expression])
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
        dot = find_attribute_dot(expression)

        if dot != -1:
            obj_expression = expression[:dot]
            attribute = expression[dot + 1:]

            obj = evaluate(obj_expression)

            return get_attribute(obj, attribute)
        if expression=="?":
            return UnknownType()
        if expression in {"String", "Integer", "Float", "Boolean", "Type", "Object"}:
            return TypeStore(expression)
        if expression in {"FileSystem", "FileSystem.File", "FileSystem.Folder"}:
            return TypeStore(expression, "Namespace")
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

    # Built-in function call

    printerr(f"Expression Error: Invalid expression {expression}", fatal=True)
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
        type = None
        colon=find_colon(name)
        if colon!=-1:
            type=name[colon+1:].strip()
            name=name[:colon].strip()
            
        value = line[assignment + 1:].strip()
        if type and not value:
            value = "?"
        if not value:
            printerr(
                f"Syntax Error: Expected variable value.\n"
                f" in [line {ind}]\n"
                f" {line}",
                fatal=True
            )            
        if not name:
            printerr(
                f"Syntax Error: Expected variable name.\n"
                f" in [line {ind}]\n"
                f" {line}",
                fatal=True
            )

        
        variables[name] = evaluate(value)
        return
    elif find_colon(line) != -1:
        type=line[line.index(":")+1:].strip()
        name=line[:line.index(":")].strip()
        value = "?"
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