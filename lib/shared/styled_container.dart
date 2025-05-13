import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';

class StyledContainer extends StatelessWidget {
  Widget? child;
  StyledContainer({super.key, this.child});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(top: 65, left: 17, right: 17),
      color: AppColors.whiteColor,
      child: child!,
    );
  }
}
