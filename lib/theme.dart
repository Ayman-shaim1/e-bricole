import 'package:flutter/material.dart';

import 'package:flutter/material.dart';

class AppColors {
  /// Accent principal (bouton “Reschedule”, icônes actives…)
  static const Color primaryColor = Color(0xFF0A84FF); // iOS system blue

  /// Accent secondaire (états survolés, ripple, boutons secondaires…)
  static const Color primaryAccent = Color(0xFF5AC8FA); // iOS system light blue

  /// Texte sur fond principal (blanc sur bouton bleu)
  static const Color onPrimaryColor = Color(0xFFFFFFFF);

  ///
  static const Color whiteColor = Color(0xFFFFFFFF);

  /// Texte principal (titres, labels)
  static const Color textPrimaryColor = Color(0xFF000000);

  /// Texte secondaire (sous-titres, détails)
  static const Color textSecondaryColor = Color.fromARGB(255, 140, 136, 136);

  /// Fond d’écran (derrière les cartes)
  static const Color backgroundColor = Color.fromARGB(246, 244, 244, 255);

  /// Surface des cartes (blanc)
  static const Color surfaceColor = Color(0xFFFFFFFF);

  /// Bordure des boutons Outline (bouton “Cancel”)
  static const Color borderColor = Color(0xFFC6C6C8);
}

ThemeData primaryTheme = ThemeData(
  fontFamily: 'SF Pro Text', // ou 'SF Pro Display' selon le style
  // seed color :
  colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primaryColor),
  // scaffold color :
  scaffoldBackgroundColor: AppColors.backgroundColor,
  // app bar theme color :
  appBarTheme: AppBarTheme(
    backgroundColor: AppColors.primaryColor,
    foregroundColor: AppColors.textPrimaryColor,
    surfaceTintColor: Colors.transparent,
    centerTitle: true,
  ),
  // text theme :
  textTheme: const TextTheme().copyWith(
    bodyMedium: TextStyle(
      // color: AppColors.textColor,
      fontSize: 16,
      letterSpacing: 0.5,
    ),
    headlineMedium: TextStyle(
      // color: AppColors.titleColor,
      fontSize: 16,
      letterSpacing: 0.5,
      fontWeight: FontWeight.bold,
    ),
    titleMedium: TextStyle(
      // color: AppColors.titleColor,
      fontSize: 18,
      letterSpacing: 1,
      fontWeight: FontWeight.bold,
    ),
  ),

  // card theme :
  cardTheme: CardTheme(
    // color: AppColors.secondaryColor.withOpacity(0.5),
    surfaceTintColor: Colors.transparent,
    shape: const RoundedRectangleBorder(),
    shadowColor: Colors.transparent,
    margin: const EdgeInsets.only(bottom: 16),
  ),

  // input decoration theme :
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    // fillColor: AppColors.secondaryColor.withOpacity(0.5),
    border: InputBorder.none,
    // labelStyle: TextStyle(color: AppColors.textColor),
    // prefixIconColor: AppColors.textColor
  ),

  // dialog theme  :
  dialogTheme: DialogTheme(
    // backgroundColor: AppColors.secondaryAccent,
    surfaceTintColor: Colors.transparent,
  ),
  bottomNavigationBarTheme: BottomNavigationBarThemeData(
    backgroundColor: Colors.white,
    // elevation: 8,
    type: BottomNavigationBarType.fixed, 
    selectedItemColor: AppColors.primaryColor,
    unselectedItemColor: Colors.grey.shade500,
    selectedLabelStyle: TextStyle(fontWeight: FontWeight.w500),
    unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500),
    showUnselectedLabels: true,
  ),
);
