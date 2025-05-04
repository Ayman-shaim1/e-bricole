import 'package:e_bricole/shared/styled_button.dart';
import 'package:e_bricole/shared/styled_text.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';

class StyledBottomBar extends StatelessWidget {
  const StyledBottomBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(vertical: 10),
      height: 80,
      decoration: BoxDecoration(color: AppColors.whiteColor),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          BottomBarItem(),
          BottomBarItem(),
          StyledButton(onPressed: () {}, child: Icon(Icons.add)),
          BottomBarItem(),
          BottomBarItem(),
        ],
      ),
    );
  }
}

class BottomBarItem extends StatelessWidget {
  const BottomBarItem({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20),
      child: Column(children: [Icon(Icons.home), StyledText(text: 'home')]),
    );
  }
}
