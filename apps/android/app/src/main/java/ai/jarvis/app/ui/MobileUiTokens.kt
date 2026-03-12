package ai.jarvis.app.ui

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import ai.jarvis.app.R

// JARVIS Theme - Arc Reactor Blue gradient
internal val mobileBackgroundGradient =
  Brush.verticalGradient(
    listOf(
      Color(0xFF001529),
      Color(0xFF0A1929),
      Color(0xFF1E3A5F),
    ),
  )

// JARVIS Theme colors
internal val mobileSurface = Color(0xFF0A1929)
internal val mobileSurfaceStrong = Color(0xFF1E3A5F)
internal val mobileBorder = Color(0xFF2C5F8D)
internal val mobileBorderStrong = Color(0xFF00D9FF)
internal val mobileText = Color(0xFFE8F4F8)
internal val mobileTextSecondary = Color(0xFFB2EBF2)
internal val mobileTextTertiary = Color(0xFF80DEEA)
internal val mobileAccent = Color(0xFF00D9FF)
internal val mobileAccentSoft = Color(0xFF0A1929)
internal val mobileSuccess = Color(0xFF00E676)
internal val mobileSuccessSoft = Color(0xFF0D2818)
internal val mobileWarning = Color(0xFFFFB300)
internal val mobileWarningSoft = Color(0xFF2D2010)
internal val mobileDanger = Color(0xFFFF1744)
internal val mobileDangerSoft = Color(0xFF2D0D0D)
internal val mobileCodeBg = Color(0xFF001529)
internal val mobileCodeText = Color(0xFF00E5FF)

internal val mobileFontFamily =
  FontFamily(
    Font(resId = R.font.manrope_400_regular, weight = FontWeight.Normal),
    Font(resId = R.font.manrope_500_medium, weight = FontWeight.Medium),
    Font(resId = R.font.manrope_600_semibold, weight = FontWeight.SemiBold),
    Font(resId = R.font.manrope_700_bold, weight = FontWeight.Bold),
  )

internal val mobileTitle1 =
  TextStyle(
    fontFamily = mobileFontFamily,
    fontWeight = FontWeight.SemiBold,
    fontSize = 24.sp,
    lineHeight = 30.sp,
    letterSpacing = (-0.5).sp,
  )

internal val mobileTitle2 =
  TextStyle(
    fontFamily = mobileFontFamily,
    fontWeight = FontWeight.SemiBold,
    fontSize = 20.sp,
    lineHeight = 26.sp,
    letterSpacing = (-0.3).sp,
  )

internal val mobileHeadline =
  TextStyle(
    fontFamily = mobileFontFamily,
    fontWeight = FontWeight.SemiBold,
    fontSize = 16.sp,
    lineHeight = 22.sp,
    letterSpacing = (-0.1).sp,
  )

internal val mobileBody =
  TextStyle(
    fontFamily = mobileFontFamily,
    fontWeight = FontWeight.Medium,
    fontSize = 15.sp,
    lineHeight = 22.sp,
  )

internal val mobileCallout =
  TextStyle(
    fontFamily = mobileFontFamily,
    fontWeight = FontWeight.Medium,
    fontSize = 14.sp,
    lineHeight = 20.sp,
  )

internal val mobileCaption1 =
  TextStyle(
    fontFamily = mobileFontFamily,
    fontWeight = FontWeight.Medium,
    fontSize = 12.sp,
    lineHeight = 16.sp,
    letterSpacing = 0.2.sp,
  )

internal val mobileCaption2 =
  TextStyle(
    fontFamily = mobileFontFamily,
    fontWeight = FontWeight.Medium,
    fontSize = 11.sp,
    lineHeight = 14.sp,
    letterSpacing = 0.4.sp,
  )
