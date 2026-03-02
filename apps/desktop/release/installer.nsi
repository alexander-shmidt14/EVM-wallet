; EVM Wallet Installer
; NSIS Script

!include "MUI2.nsh"

; General
Name "EVM Wallet"
OutFile "EVM Wallet Setup 1.0.0.exe"
InstallDir "$LOCALAPPDATA\EVM Wallet"
InstallDirRegKey HKCU "Software\EVMWallet" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma

; UI
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_ABORTWARNING

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Language
!insertmacro MUI_LANGUAGE "English"

; Installer Section
Section "Install"
  SetOutPath "$INSTDIR"

  ; Copy all files from win-unpacked
  File /r "win-unpacked\*.*"

  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Registry
  WriteRegStr HKCU "Software\EVMWallet" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EVMWallet" "DisplayName" "EVM Wallet"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EVMWallet" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EVMWallet" "DisplayIcon" "$\"$INSTDIR\EVM Wallet.exe$\""
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EVMWallet" "Publisher" "EVM Wallet"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EVMWallet" "DisplayVersion" "1.0.0"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EVMWallet" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EVMWallet" "NoRepair" 1

  ; Shortcuts
  CreateDirectory "$SMPROGRAMS\EVM Wallet"
  CreateShortcut "$SMPROGRAMS\EVM Wallet\EVM Wallet.lnk" "$INSTDIR\EVM Wallet.exe" "" "$INSTDIR\EVM Wallet.exe" 0
  CreateShortcut "$SMPROGRAMS\EVM Wallet\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\EVM Wallet.lnk" "$INSTDIR\EVM Wallet.exe" "" "$INSTDIR\EVM Wallet.exe" 0
SectionEnd

; Uninstaller Section
Section "Uninstall"
  ; Remove files
  RMDir /r "$INSTDIR"

  ; Remove shortcuts
  Delete "$SMPROGRAMS\EVM Wallet\*.*"
  RMDir "$SMPROGRAMS\EVM Wallet"
  Delete "$DESKTOP\EVM Wallet.lnk"

  ; Remove registry
  DeleteRegKey HKCU "Software\EVMWallet"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\EVMWallet"
SectionEnd
