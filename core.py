import builtins
import typing
import colorama
import sys
colorama.init()
_GAME_SCRIPT_VERSION = "1.0.0"
def print(
        *values: object,
        printtype: typing.Literal["message","warning","error"] = "message"
          ):
    match printtype:
        
        case "message":
            builtins.print(*values)

        case "warning":
            builtins.print(colorama.Fore.YELLOW + " ".join(map(str,values)) + colorama.Fore.RESET)
        case "error":
            builtins.print(colorama.Fore.RED + " ".join(map(str,values)) + colorama.Fore.RESET)
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
def versinfo():
    printbash(f"GameScript {_GAME_SCRIPT_VERSION} (Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro})\n")
    if sys.version_info<(3,12):
        printwarn(f"[Warning] GameScript requires Python 3.12 or newer, keep version \"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}\" may produce an error later.")
    printbash("To see version history or feature, go to https://github.com/qzou1222-alt/GameScript.")