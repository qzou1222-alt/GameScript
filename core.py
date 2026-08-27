import builtins
import typing
import colorama
import sys
colorama.init()
_GAME_SCRIPT_VERSION = "1.3.0"
NaN=float("nan")
def print(
        *values: object,
        printtype: typing.Literal["message","warning","error","info"] = "message"
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
def input(prompt: str = "") -> str:
    return builtins.input(prompt)
def printbash(*values:object):
    builtins.print(*values)
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
class _BoolHumanRead:
    def __init__(self, b: bool):
        self.b=b
    def __str__(self):
        return "true" if self.b else "false"
class _NoneType:
    def __str__(self):
        return "none"
    