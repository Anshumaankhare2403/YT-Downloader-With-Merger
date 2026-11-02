Add-Type -AssemblyName System.Drawing

$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Clear background
$g.Clear([System.Drawing.Color]::Transparent)

# Background dark rounded rect
$rect = New-Object System.Drawing.Rectangle(12, 12, 232, 232)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 48
$d = $radius * 2
$arc = New-Object System.Drawing.Rectangle(12, 12, $d, $d)
$path.AddArc($arc, 180, 90)
$arc.X = 244 - $d
$path.AddArc($arc, 270, 90)
$arc.Y = 244 - $d
$path.AddArc($arc, 0, 90)
$arc.X = 12
$path.AddArc($arc, 90, 90)
$path.CloseFigure()

$pt1 = New-Object System.Drawing.Point(0, 0)
$pt2 = New-Object System.Drawing.Point(256, 256)
$c1 = [System.Drawing.Color]::FromArgb(255, 15, 23, 42)
$c2 = [System.Drawing.Color]::FromArgb(255, 30, 27, 75)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($pt1, $pt2, $c1, $c2)
$g.FillPath($bgBrush, $path)

# Border
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 51, 65, 85), [float]4)
$g.DrawPath($borderPen, $path)

# Inner Badge
$innerPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$inRadius = 32
$inD = $inRadius * 2
$inArc = New-Object System.Drawing.Rectangle(44, 44, $inD, $inD)
$innerPath.AddArc($inArc, 180, 90)
$inArc.X = 212 - $inD
$innerPath.AddArc($inArc, 270, 90)
$inArc.Y = 212 - $inD
$innerPath.AddArc($inArc, 0, 90)
$inArc.X = 44
$innerPath.AddArc($inArc, 90, 90)
$innerPath.CloseFigure()

$inPt1 = New-Object System.Drawing.Point(44, 44)
$inPt2 = New-Object System.Drawing.Point(212, 212)
$inC1 = [System.Drawing.Color]::FromArgb(255, 239, 68, 68)
$inC2 = [System.Drawing.Color]::FromArgb(255, 249, 115, 22)
$innerBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($inPt1, $inPt2, $inC1, $inC2)
$g.FillPath($innerBrush, $innerPath)

# Arrow and Tray
$arrowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [float]14)
$arrowPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$arrowPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$arrowPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

# Vertical line
$g.DrawLine($arrowPen, 128, 80, 128, 145)
# Arrow head
$pts = [System.Drawing.Point[]]@(
    (New-Object System.Drawing.Point(100, 122)),
    (New-Object System.Drawing.Point(128, 150)),
    (New-Object System.Drawing.Point(156, 122))
)
$g.DrawLines($arrowPen, $pts)

# Base Tray
$g.DrawLine($arrowPen, 92, 175, 164, 175)

$g.Dispose()

$targetDir = "resources\icons"
$pngPath = "$targetDir\icon.png"
$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Save as ICO
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$icoStream = [System.IO.File]::OpenWrite("$targetDir\icon.ico")
$icon.Save($icoStream)
$icoStream.Close()
$bmp.Dispose()

Write-Output "Icons generated successfully: $pngPath and $targetDir\icon.ico"
