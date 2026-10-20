GRID BLOCKS for After Effects
Works with After Effects 2022 (v22) and newer, on Mac and Windows.

INSTALL  (unzip first — on Windows: right-click the zip > Extract All…)
  Mac:      double-click "Install on Mac.command"
            (if macOS says it can't be opened: right-click it > Open > Open)
  Windows:  double-click "Install on Windows.bat"
            (if SmartScreen warns: More info > Run anyway)
  Then restart After Effects and open  Window > Extensions > Grid Blocks.

  The installer also adds any brand font files you put in Fonts/ (Aeonik /
  Aeonik Fono .otf, from the Ava Labs brand drive) for your user,
  and turns on "PlayerDebugMode", which After Effects needs for panels that
  aren't from the Adobe Exchange store.

MANUAL INSTALL (if you'd rather not run the installer)
  Copy the GridBlocks folder to:
    Mac:      ~/Library/Application Support/Adobe/CEP/extensions/GridBlocks
    Windows:  %APPDATA%\Adobe\CEP\extensions\GridBlocks
  and enable debug mode:
    Mac (Terminal):  for v in 9 10 11 12 13; do defaults write com.adobe.CSXS.$v PlayerDebugMode 1; done
    Windows (cmd):   reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
                     (repeat for CSXS.12 and CSXS.13)

SAMPLE WORKFLOW
  In the panel: Layouts > Sample workflows > Load.
  The two .json files are the same scenes as files (Layouts > Open from file…).
  If the panel ever opens black, try Window > Extensions > Grid Blocks (safe mode).

MEDIA IN BLOCKS
  The sample clip lives in GridBlocks/media. Your own videos/images are linked
  by their file path; if one moves, After Effects asks you to find it.

UPDATING
  Run the installer again — it replaces the old version. Restart After Effects.

Web version: https://avalanche-block-builder.vercel.app
