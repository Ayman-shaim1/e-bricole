import 'package:e_bricole/ThemeProvider.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class StyledCard extends StatelessWidget {
  final Widget child;
  const StyledCard({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context).effectiveMode;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
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
