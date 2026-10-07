Set oShell = CreateObject("WScript.Shell")
sDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
oShell.CurrentDirectory = sDir
oShell.Run "pythonw run.py", 0, False
