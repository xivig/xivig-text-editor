; Xivig Text Editor - Custom NSIS Installer & Updater Logic
; Provides in-place seamless updates (prevents deleting old version during update)
; and registers Windows Explorer right-click context menu "Open with Xivig Text Editor"

!macro customHeader
  !define CUSTOM_XIVIG_INSTALLER_ACTIVE
!macroend

!macro customInstall
  DetailPrint "Registering Windows Explorer context menu for Xivig Text Editor..."
  ${if} ${FileExists} "$appExe"
    ; 1. Right-click on any file -> "Open with Xivig Text Editor"
    WriteRegStr SHELL_CONTEXT "Software\Classes\*\shell\Open with Xivig Text Editor" "" "Open with Xivig Text Editor"
    WriteRegStr SHELL_CONTEXT "Software\Classes\*\shell\Open with Xivig Text Editor" "Icon" '"$appExe",0'
    WriteRegStr SHELL_CONTEXT "Software\Classes\*\shell\Open with Xivig Text Editor\command" "" '"$appExe" "%1"'

    ; 2. Right-click on any folder/directory -> "Open with Xivig Text Editor"
    WriteRegStr SHELL_CONTEXT "Software\Classes\Directory\shell\Open with Xivig Text Editor" "" "Open with Xivig Text Editor"
    WriteRegStr SHELL_CONTEXT "Software\Classes\Directory\shell\Open with Xivig Text Editor" "Icon" '"$appExe",0'
    WriteRegStr SHELL_CONTEXT "Software\Classes\Directory\shell\Open with Xivig Text Editor\command" "" '"$appExe" "%V"'

    ; 3. Right-click inside background of any folder -> "Open with Xivig Text Editor"
    WriteRegStr SHELL_CONTEXT "Software\Classes\Directory\Background\shell\Open with Xivig Text Editor" "" "Open with Xivig Text Editor"
    WriteRegStr SHELL_CONTEXT "Software\Classes\Directory\Background\shell\Open with Xivig Text Editor" "Icon" '"$appExe",0'
    WriteRegStr SHELL_CONTEXT "Software\Classes\Directory\Background\shell\Open with Xivig Text Editor\command" "" '"$appExe" "%V"'
  ${endif}
!macroend

!macro customUnInstall
  ; Remove Explorer context menu entries when performing a true uninstall
  ${ifNot} ${isUpdated}
    DeleteRegKey SHELL_CONTEXT "Software\Classes\*\shell\Open with Xivig Text Editor"
    DeleteRegKey SHELL_CONTEXT "Software\Classes\Directory\shell\Open with Xivig Text Editor"
    DeleteRegKey SHELL_CONTEXT "Software\Classes\Directory\Background\shell\Open with Xivig Text Editor"
  ${endif}
!macroend

!macro customRemoveFiles
  ; Prevent updater from deleting the old version directory ($INSTDIR) and reinstalling
  ; During an update, files are extracted and updated cleanly in-place
  ${ifNot} ${isUpdated}
    SetOutPath $TEMP
    RMDir /r $INSTDIR
  ${else}
    DetailPrint "Preserving installed files and user configurations for in-place update..."
  ${endif}
!macroend
