import 'package:flutter/material.dart';

class StyledContainer extends StatelessWidget {
  Widget? child;
  StyledContainer({super.key, this.child});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 12, horizontal: 17),
        child: child!,
      ),
    );
  }
}
