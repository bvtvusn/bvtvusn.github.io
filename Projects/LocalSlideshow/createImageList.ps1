# Get the directory of the script file
$currentDirectory = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

# Get all image files in the current folder
$imageFiles = Get-ChildItem -Path $currentDirectory | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|gif|bmp)$' } | Select-Object -ExpandProperty Name

# Create the content for imageList.js
$listContent = 'const imageList = ["'
$listContent += $imageFiles -join '" , "'
$listContent += '"];'
# Write the content to imageList.js
$listContent | Out-File -FilePath "$currentDirectory\imageList.js" -Encoding utf8

Write-Host "imageList.js created with the list of image filenames."
