Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\anshu\.gemini\antigravity\brain\e7fb6d00-33df-4bea-8d28-0d3d56e89426\.user_uploaded\media_1793605595434_7a628afa.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source logo file not found at $srcPath"
    exit 1
}

$destDirs = @(
    "D:\YT-Downloader-With-Merger\resources\icons",
    "D:\YT-Downloader-With-Merger\frontend\public",
    "D:\YT-Downloader-With-Merger\frontend\src\assets"
)

foreach ($dir in $destDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# 1. Copy original file
Copy-Item -Path $srcPath -Destination "D:\YT-Downloader-With-Merger\resources\icons\logo-original.png" -Force
Copy-Item -Path $srcPath -Destination "D:\YT-Downloader-With-Merger\frontend\public\logo-original.png" -Force
Copy-Item -Path $srcPath -Destination "D:\YT-Downloader-With-Merger\frontend\src\assets\logo-original.png" -Force

# 2. Process transparent versions using Bitmap
$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $srcBmp.Width
$height = $srcBmp.Height

Write-Output "Processing $width x $height image..."

# Create transparent black ink bitmap
$blackBmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
# Create transparent white ink bitmap
$whiteBmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Lock bits for fast pixel processing
$rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$srcData = $srcBmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$blackData = $blackBmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$whiteData = $whiteBmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$bytes = [Math]::Abs($srcData.Stride) * $height
$srcBytes = New-Object byte[] $bytes
$blackBytes = New-Object byte[] $bytes
$whiteBytes = New-Object byte[] $bytes

[System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $srcBytes, 0, $bytes)

# Process every pixel (BGRA order)
for ($i = 0; $i -lt $bytes; $i += 4) {
    $b = [int]$srcBytes[$i]
    $g = [int]$srcBytes[$i + 1]
    $r = [int]$srcBytes[$i + 2]
    
    # Calculate perceived luminance (0 to 255)
    $lum = 0.299 * $r + 0.587 * $g + 0.114 * $b
    
    # Background parchment luminance is around 242-246
    # Ink luminance is around 20-50
    # Map luminance to ink coverage (alpha)
    $alpha = 0
    if ($lum -lt 240) {
        $coverage = (240 - $lum) / (240 - 25)
        if ($coverage -gt 1.0) { $coverage = 1.0 }
        if ($coverage -lt 0.0) { $coverage = 0.0 }
        # Non-linear curve for punchy brush contrast
        $coverage = [Math]::Pow($coverage, 0.9)
        $alpha = [int]($coverage * 255)
        if ($alpha -gt 255) { $alpha = 255 }
    }
    
    # Black ink on transparent
    $blackBytes[$i] = 15      # B
    $blackBytes[$i + 1] = 15  # G
    $blackBytes[$i + 2] = 15  # R
    $blackBytes[$i + 3] = [byte]$alpha

    # White ink on transparent
    $whiteBytes[$i] = 250     # B
    $whiteBytes[$i + 1] = 250 # G
    $whiteBytes[$i + 2] = 250 # R
    $whiteBytes[$i + 3] = [byte]$alpha
}

[System.Runtime.InteropServices.Marshal]::Copy($blackBytes, 0, $blackData.Scan0, $bytes)
[System.Runtime.InteropServices.Marshal]::Copy($whiteBytes, 0, $whiteData.Scan0, $bytes)

$srcBmp.UnlockBits($srcData)
$blackBmp.UnlockBits($blackData)
$whiteBmp.UnlockBits($whiteData)

# Save transparent images
$blackBmp.Save("D:\YT-Downloader-With-Merger\resources\icons\logo-black.png", [System.Drawing.Imaging.ImageFormat]::Png)
$blackBmp.Save("D:\YT-Downloader-With-Merger\frontend\public\logo-black.png", [System.Drawing.Imaging.ImageFormat]::Png)
$blackBmp.Save("D:\YT-Downloader-With-Merger\frontend\src\assets\logo-black.png", [System.Drawing.Imaging.ImageFormat]::Png)

$whiteBmp.Save("D:\YT-Downloader-With-Merger\resources\icons\logo-white.png", [System.Drawing.Imaging.ImageFormat]::Png)
$whiteBmp.Save("D:\YT-Downloader-With-Merger\frontend\public\logo-white.png", [System.Drawing.Imaging.ImageFormat]::Png)
$whiteBmp.Save("D:\YT-Downloader-With-Merger\frontend\src\assets\logo-white.png", [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output "Transparent logo variations generated successfully."

# 3. Generate icon.png (512x512 with rounded squircle badge)
$iconSize = 512
$iconBmp = New-Object System.Drawing.Bitmap($iconSize, $iconSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($iconBmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Clear with transparent
$g.Clear([System.Drawing.Color]::Transparent)

# Draw rounded rectangle parchment tile
$pad = 20
$tileRect = New-Object System.Drawing.Rectangle($pad, $pad, ($iconSize - 2 * $pad), ($iconSize - 2 * $pad))
$radius = 90

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc($tileRect.X, $tileRect.Y, $radius, $radius, 180, 90)
$path.AddArc($tileRect.Right - $radius, $tileRect.Y, $radius, $radius, 270, 90)
$path.AddArc($tileRect.Right - $radius, $tileRect.Bottom - $radius, $radius, $radius, 0, 90)
$path.AddArc($tileRect.X, $tileRect.Bottom - $radius, $radius, $radius, 90, 90)
$path.CloseFigure()

# Fill background parchment (#F6F4F0)
$parchmentColor = [System.Drawing.Color]::FromArgb(255, 246, 244, 240)
$brush = New-Object System.Drawing.SolidBrush($parchmentColor)
$g.FillPath($brush, $path)

# Add subtle dark border
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 200, 195, 185), [float]4)
$g.DrawPath($borderPen, $path)

# Draw scaled black brush logo centered inside
$innerPad = 48
$logoRect = New-Object System.Drawing.Rectangle($innerPad, $innerPad, ($iconSize - 2 * $innerPad), ($iconSize - 2 * $innerPad))
$g.DrawImage($blackBmp, $logoRect)

$g.Dispose()

# Save icon.png
$iconBmp.Save("D:\YT-Downloader-With-Merger\resources\icons\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$iconBmp.Save("D:\YT-Downloader-With-Merger\frontend\public\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$iconBmp.Save("D:\YT-Downloader-With-Merger\frontend\public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$iconBmp.Save("D:\YT-Downloader-With-Merger\frontend\src\assets\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output "Generated icon.png and favicon.png"

# 4. Generate multi-resolution icon.ico
$icoSizes = @(256, 128, 64, 48, 32, 16)
$icoBitmaps = @()

foreach ($sz in $icoSizes) {
    $resized = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gr = [System.Drawing.Graphics]::FromImage($resized)
    $gr.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $gr.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gr.DrawImage($iconBmp, 0, 0, $sz, $sz)
    $gr.Dispose()
    $icoBitmaps += $resized
}

# Write multi-size ICO binary structure
$icoStream = [System.IO.File]::Create("D:\YT-Downloader-With-Merger\resources\icons\icon.ico")
$bw = New-Object System.IO.BinaryWriter($icoStream)

# ICONDIR header: idReserved (0), idType (1 for ICO), idCount
$bw.Write([uint16]0)
$bw.Write([uint16]1)
$bw.Write([uint16]$icoBitmaps.Count)

$pngStreams = @()
foreach ($bmp in $icoBitmaps) {
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngStreams += $ms
}

# Offset after header (6) + entries (16 * count)
$offset = 6 + (16 * $icoBitmaps.Count)

for ($idx = 0; $idx -lt $icoBitmaps.Count; $idx++) {
    $sz = $icoSizes[$idx]
    $ms = $pngStreams[$idx]
    $dataLen = [uint32]$ms.Length

    $bWidth = if ($sz -ge 256) { 0 } else { [byte]$sz }
    $bHeight = if ($sz -ge 256) { 0 } else { [byte]$sz }

    $bw.Write([byte]$bWidth)        # Width
    $bw.Write([byte]$bHeight)       # Height
    $bw.Write([byte]0)              # Color count
    $bw.Write([byte]0)              # Reserved
    $bw.Write([uint16]1)            # Color planes
    $bw.Write([uint16]32)           # Bits per pixel
    $bw.Write([uint32]$dataLen)     # Image size in bytes
    $bw.Write([uint32]$offset)      # File offset

    $offset += $dataLen
}

# Write PNG payloads
for ($idx = 0; $idx -lt $icoBitmaps.Count; $idx++) {
    $ms = $pngStreams[$idx]
    $bytesData = $ms.ToArray()
    $bw.Write($bytesData)
    $ms.Dispose()
    $icoBitmaps[$idx].Dispose()
}

$bw.Close()
$icoStream.Close()

# Copy to frontend/public/favicon.ico
Copy-Item -Path "D:\YT-Downloader-With-Merger\resources\icons\icon.ico" -Destination "D:\YT-Downloader-With-Merger\frontend\public\favicon.ico" -Force

$iconBmp.Dispose()
$blackBmp.Dispose()
$whiteBmp.Dispose()
$srcBmp.Dispose()

Write-Output "Successfully generated all logo variations and multi-size Windows icon.ico!"

