Set WshShell = CreateObject("WScript.Shell")
appDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = appDir
WshShell.Run """" & appDir & "\node_modules\.bin\electron.cmd"" .", 0, False
