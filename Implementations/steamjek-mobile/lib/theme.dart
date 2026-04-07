import 'package:flutter/material.dart';

class SteamJekTheme {
  static const Color bg = Color(0xFF07090F);
  static const Color bg2 = Color(0xFF0C0F1A);
  static const Color bg3 = Color(0xFF111827);
  static const Color panel = Color(0xFF131B2E);
  static const Color panel2 = Color(0xFF1A2540);
  static const Color border = Color(0xFF1E2D4A);
  static const Color border2 = Color(0xFF253656);
  static const Color accent = Color(0xFF00D4FF);
  static const Color accent2 = Color(0xFF7C3AED);
  static const Color gold = Color(0xFFF59E0B);
  static const Color red = Color(0xFFEF4444);
  static const Color green = Color(0xFF10B981);
  static const Color text = Color(0xFFE2E8F0);
  static const Color muted = Color(0xFF64748B);
  static const Color muted2 = Color(0xFF94A3B8);

  static final ThemeData theme = ThemeData(
    brightness: Brightness.dark,
    primaryColor: accent,
    scaffoldBackgroundColor: bg,
    appBarTheme: const AppBarTheme(
      backgroundColor: bg2,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        fontFamily: 'Exo 2',
        fontWeight: FontWeight.w600,
        fontSize: 20,
        color: text,
      ),
      iconTheme: IconThemeData(color: text),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: bg2,
      selectedItemColor: accent,
      unselectedItemColor: muted,
      showUnselectedLabels: true,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: accent,
        foregroundColor: bg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(fontWeight: FontWeight.bold),
      ),
    ),
    cardColor: panel,
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: text),
      bodyMedium: TextStyle(color: text),
      bodySmall: TextStyle(color: muted2),
      titleLarge: TextStyle(color: text, fontWeight: FontWeight.bold),
      titleMedium: TextStyle(color: text, fontWeight: FontWeight.w600),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: panel,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: accent),
      ),
      labelStyle: const TextStyle(color: muted2),
      hintStyle: const TextStyle(color: muted),
    ),
  );
}
