# One-Click YouTube Video Uploader
param (
    [string]$File = "",
    [string]$Title = "",
    [string]$Description = "",
    [string]$Tags = "Shorts,YouTube",
    [string]$Privacy = "private",
    [string]$Thumbnail = "",
    [switch]$DryRun
)

$cmdArgs = @("scripts\upload_video.py")
if ($File) { $cmdArgs += "--file", $File }
if ($Title) { $cmdArgs += "--title", $Title }
if ($Description) { $cmdArgs += "--description", $Description }
if ($Tags) { $cmdArgs += "--tags", $Tags }
if ($Privacy) { $cmdArgs += "--privacy", $Privacy }
if ($Thumbnail) { $cmdArgs += "--thumbnail", $Thumbnail }
if ($DryRun) { $cmdArgs += "--dry-run" }

& .venv\Scripts\python.exe $cmdArgs

