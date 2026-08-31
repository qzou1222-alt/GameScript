import builtins
import typing
import colorama
import sys
import subprocess
import pathlib
import types
colorama.init()
_GAME_SCRIPT_VERSION = "1.6.0"
NaN=float("nan")
def print(
        *values: object,
        printtype: typing.Literal["message","warning","error","info", "scuccessful"] = "message"
          ):
    match printtype:
        
        case "message":
            builtins.print(*values)

        case "warning":
            builtins.print(colorama.Fore.YELLOW + " ".join(map(str,values)) + colorama.Fore.RESET)
        case "error":
            builtins.print(colorama.Fore.RED + " ".join(map(str,values)) + colorama.Fore.RESET)
        case "info":
            builtins.print(colorama.Fore.BLUE + " ".join(map(str,values)) + colorama.Fore.RESET)
        case "scuccessful":
            builtins.print(colorama.Fore.GREEN + " ".join(map(str,values)) + colorama.Fore.RESET)
def input(prompt: str = "") -> str:
    return builtins.input(prompt)
def printbash(message: object):
    print(message)
def printfinish(message:object):
    print(message,printtype="scuccessful")
def printerr(message:object, fatal: bool = False):
    print(message,printtype="error")
    if fatal:
        raise SystemExit(1)
    
def printwarn(message:object, fatal: bool = False):
    print(message,printtype="warning")
    if fatal:
        raise SystemExit(1)
def printinfo(message:object):
    print(message, printtype="info")
def versinfo():
    printinfo(f"GameScript {_GAME_SCRIPT_VERSION} (Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro})\n")
    if sys.version_info<(3,12):
        printwarn(f"[Warning] GameScript requires Python 3.12 or newer, keep version \"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}\" may produce an error later.")
    printbash("To see version history or feature, go to https://github.com/qzou1222-alt/GameScript.")
def is_integer(value:object, allow_stringfloat:bool=True) -> bool:
    if isinstance(value,float):
        return value.is_integer()
    try:
        int(value)
        return True
    except (TypeError, ValueError):
        if allow_stringfloat:
            try:
                float(value).is_integer()
                return True
            except (TypeError, ValueError):
                return False
        return False
def is_float(value:object) -> bool:
    try:
        float(value)
        return True
    except (TypeError, ValueError):
        return False
def sum(*values:int|float):
    if len(values)==0:
        return None
    return builtins.sum(values)
def sub(*values:int|float):
    if len(values)==0:
        return None
    start=values[0]
    for value in values[1:]:
        start-=value
    return start
def mul(*values:int|float):
    if len(values)==0:
        return None
    start=values[0]
    for value in values[1:]:
        start*=value
    return start
def div(*values:int|float):
    if len(values)==0:
        return None
    start=values[0]
    for value in values[1:]:
        if value==0:
            return NaN
        start/=value
    return start
def strupper(string: str):
    return string.upper()
def strlower(string: str):
    return string.lower()
def strjoin(*strings: str, sep: str = ""):
    return sep.join(strings)
def strrepeat(string: str, amount: int):
    return string*amount
def strlen(string: str):
    return len(string)
def strcontains(string: str, contains: str):
    return contains in string

def playscript(file: str):
    subprocess.run(
        [
            "python",
            str(pathlib.Path(__file__).parent / "runner.py"),
            file
        ]
    )
def typeisinstance(obj: object, type: "TypeStore"):
    match type.cls:
        case "Integer":
            return isinstance(obj, int)
        case "Float":
            return isinstance(obj, float)
        case "String":
            return isinstance(obj, str)
        case "Type":
            return isinstance(obj, (Type,TypeStore))
        case "NoneType":
            return isinstance(obj, _NoneType)
        case "Boolean":
            return isinstance(obj, _BoolHumanRead)
        case "Unknown":
            return isinstance(obj, UnknownType)
        case "Function":
            return isinstance(obj, Function)
        case _:
            return False
class _BoolHumanRead(int):
    def __init__(self, b: bool):
        self.b=b
    def __str__(self):
        return "true" if self.b else "false"
    def __bool__(self):
        return self.b
class _NoneType:
    def __str__(self):
        return "none"
    def __bool__(self):
        return False
class Object:
    def _to_string(self):
        return "<Object instance>"
class UnknownType:
    def __str__(self):
        return "?"
class TypeStore:
    def __init__(self, cls: str):
        self.cls=cls
    def __str__(self):
        return f"<Class> {self.cls}"
class Type:
    def __init__(self, obj):
        if isinstance(obj, (str,String)):
            self.type = TypeStore("String")
        elif isinstance(obj, _BoolHumanRead):
            self.type = TypeStore("Boolean")
        elif isinstance(obj, int):
            self.type = TypeStore("Integer")

        elif isinstance(obj, float):
            self.type = TypeStore("Float")

        elif isinstance(obj, UnknownType):
            self.type = TypeStore("Unknown")

        elif isinstance(obj, _NoneType):
            self.type = TypeStore("NoneType")
        
        elif isinstance(obj, (Type,TypeStore)):
            self.type = TypeStore("Type")
        elif isinstance(obj, Function):
            self.type = TypeStore("Function")
        else:
            self.type = TypeStore("Invalid")

    def __str__(self):
        return str(self.type)
class Function:
    def __init__(self, func: types.FunctionType):
        self.func=func
    def __str__(self):
        return f"<Function> {self.func.__name__}"
class Boolean:
    def __init__(self, obj: object):
        self.boolean= _BoolHumanRead(bool(obj))
    def __str__(self):
        return str(self.boolean)
class String:
    def __init__(self, obj:object):
        self.string=str(obj)
    def remove(self, char: "String", change_itself: bool = True):
        string=self.string.replace(char.string, "")
        if change_itself:
            self.string=string
        return string
    def _get_length(self):
        return len(self.string)
    def _to_string(self):
        return self.string
    def __str__(self):
        return self._to_string()
