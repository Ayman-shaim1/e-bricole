import 'package:e_bricole/screens/home_screen.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'e-bricole',
      theme: primaryTheme,
      home: HomeScreen(),
    );
  }
}

