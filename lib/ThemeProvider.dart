import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Fournit un ThemeMode choisi (light/dark/system) et expose le mode effectif
/// (light ou dark) en se basant sur la luminosité du système si nécessaire.
class ThemeProvider extends ChangeNotifier {
  ThemeMode _mode = ThemeMode.system;

  /// Mode sélectionné (light/dark/system)
  ThemeMode get mode => _mode;

  /// Mode réel appliqué (light ou dark), même si System
  ThemeMode get effectiveMode {
    if (_mode == ThemeMode.system) {
      final brightness = ui.window.platformBrightness;
      return brightness == Brightness.dark ? ThemeMode.dark : ThemeMode.light;
    }
    return _mode;
  }

  ThemeProvider() {
    _loadFromPrefs();
  }

  /// Change le ThemeMode et le persiste
  void setMode(ThemeMode newMode) {
    if (newMode == _mode) return;
    _mode = newMode;
    notifyListeners();
    _saveToPrefs();
  }

  Future<void> _loadFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final idx = prefs.getInt('themeMode') ?? ThemeMode.system.index;
    _mode = ThemeMode.values[idx];
    notifyListeners();
  }

  Future<void> _saveToPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('themeMode', _mode.index);
  }
}
