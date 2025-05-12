import 'package:e_bricole/screens/client/requests_screen.dart';
import 'package:e_bricole/screens/client/home_screen.dart';
import 'package:e_bricole/screens/messages_screen.dart';
import 'package:e_bricole/screens/client/profil_screen.dart';
import 'package:e_bricole/shared/notifications.dart';
import 'package:e_bricole/shared/styled_text.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';

class AppLayout extends StatefulWidget {
  const AppLayout({super.key});

  @override
  State<AppLayout> createState() => _AppLayoutState();
}

class _AppLayoutState extends State<AppLayout> {
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
        backgroundColor: AppColors.primaryColor,
        actionsPadding: EdgeInsets.only(right: 10.0),
        title: StyledHeading(
          text: "Bonjour John Doe",
          color: AppColors.whiteColor,
        ),
        actions: [Notifications()],
      ),

      body: _pages[_selectedIndex],

      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: AppColors.primaryColor,
        shape: CircleBorder(),
        elevation: 2,
        child: Icon(Icons.add, size: 40, color: AppColors.whiteColor),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: Theme(
        data: Theme.of(context).copyWith(
          splashFactory: NoSplash.splashFactory,
          highlightColor: Colors.transparent,
        ),
        child: BottomNavigationBar(

     
          items: const <BottomNavigationBarItem>[
            BottomNavigationBarItem(
              icon: Icon(Icons.home, size: 30),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.view_list_rounded, size: 30),
              label: 'Requests',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.message, size: 30),
              label: 'Messages',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person, size: 30),
              label: 'Profile',
            ),
          ],
          currentIndex: _selectedIndex,
          onTap: _onItemTapped,
        ),
      ),
    );
  }
}
