import 'package:e_bricole/screens/requests_screen.dart';
import 'package:e_bricole/screens/home_screen.dart';
import 'package:e_bricole/screens/messages_screen.dart';
import 'package:e_bricole/screens/profil_screen.dart';
import 'package:e_bricole/shared/notifications.dart';
import 'package:e_bricole/shared/styled_bottom_bar.dart';
import 'package:e_bricole/shared/styled_text.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';

class AppScreen extends StatefulWidget {
  const AppScreen({super.key});

  @override
  State<AppScreen> createState() => _AppScreenState();
}

class _AppScreenState extends State<AppScreen> {
  // 1. Track which tab is selected
  int _selectedIndex = 0;

  // 2. Define the pages for each tab
  static const List<Widget> _pages = <Widget>[
    HomeScreen(),
    RequestsScreen(),
    MessagesScreen(),
    ProfilScreen(),
  ];

  // 3. Update the index when a tab is tapped
  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actionsPadding: EdgeInsets.only(right: 10.0),
        title: StyledHeading(
          text: "Bonjour John Doe",
          color: AppColors.whiteColor,
        ),
        actions: [Notifications()],
      ),
      body: Column(
        children: [
          Expanded(child: _pages[_selectedIndex]),
           StyledBottomBar(),
        ],
      ),
    );
  }
}
