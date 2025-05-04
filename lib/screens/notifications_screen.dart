import 'package:e_bricole/shared/styled_text.dart';
import 'package:flutter/material.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            IconButton(
              onPressed: () => Navigator.pop(context),
              padding: EdgeInsets.symmetric(
                horizontal: 8,
                vertical: 4,
              ), // moins de padding
              constraints: BoxConstraints(
                minWidth: 0,
                minHeight: 0,
              ), // supprime la taille minimale
              icon: Row(
                mainAxisSize: MainAxisSize.min, // taille minimale du Row
                children: [
                  Icon(Icons.arrow_back, size: 20),
                  SizedBox(width: 6),
                  StyledText(text: "go back"),
                ],
              ),
            ),
            Center(child: StyledText(text: "notifications")),
          ],
        ),
      ),
    );
  }

}
