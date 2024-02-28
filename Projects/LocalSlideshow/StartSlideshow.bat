@echo off
setlocal enabledelayedexpansion
set "filelist="

rem Add the starting string
echo const imageList = [ > imageList.js

rem Loop through the files with specified extensions
for %%i in (*.png *.jpg *.jpeg *.bmp *.gif *.webp) do (
    if defined filelist (
        set "filelist=!filelist!,"%%i""
    ) else (
        set "filelist="%%i""
    )
)

rem Add the filenames to the file
echo %filelist% >> imageList.js

rem Add the ending string
echo ]; >> imageList.js

rem Open slideshow.html in the default browser
start slideshow.html