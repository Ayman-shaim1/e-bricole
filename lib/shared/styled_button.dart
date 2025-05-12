import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';

class StyledButton extends StatelessWidget {
  final double? width;
  StyledButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.width,
  });

  final Function() onPressed;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(padding: EdgeInsets.zero),
      child: Container(
        width: width,
        margin: EdgeInsets.zero,
        padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 20),
        decoration: BoxDecoration(
          color: AppColors.primaryColor,
          borderRadius: const BorderRadius.all(Radius.circular(5)),
        ),
        child: Center(child: child),
      ),
    );
  }
}
