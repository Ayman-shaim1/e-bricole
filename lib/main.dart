import 'package:e_bricole/ThemeProvider.dart';
import 'package:e_bricole/screens/app_screen.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => ThemeProvider(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeMode = Provider.of<ThemeProvider>(context).mode;
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'e-bricole',
      theme: lightTheme, // votre thème clair
      darkTheme: darkTheme,
      themeMode: themeMode,
      home: AppScreen(),
    );
  }
}
