import 'package:e_bricole/providers/ThemeProvider.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class StyledCard extends StatelessWidget {
  final Widget child;
  final double? height;
  const StyledCard({super.key, required this.child, this.height});

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context).effectiveMode;
    return Container(
      width: double.infinity,
      height: height,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color:
            theme != ThemeMode.dark
                ? AppColors.whiteColor
                : AppColors.darkBarBackgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: child,
    );
  }
}
