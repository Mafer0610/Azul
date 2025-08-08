Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c start.bat", 0, False
WshShell.Run "msedge http://localhost:5000", 0, False