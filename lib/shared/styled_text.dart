import 'package:e_bricole/ThemeProvider.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class StyledText extends StatelessWidget {
  final String text;
  final Color? color;

  const StyledText({Key? key, required this.text, this.color})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context).effectiveMode;
    final baseStyle = Theme.of(context).textTheme.bodyMedium;
    return Text(
      text,
      style: GoogleFonts.montserrat(
        textStyle: (baseStyle ?? const TextStyle()).copyWith(
          color:
              this.color ??
              (theme == ThemeMode.dark
                  ? AppColors.whiteColor
                  : AppColors.darkBarBackgroundColor),
        ),
      ),
    );
  }
}

class StyledHeading extends StatelessWidget {
  final String text;
  final Color? color;

  const StyledHeading({Key? key, required this.text, this.color})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context).effectiveMode;
    final baseStyle = Theme.of(context).textTheme.headlineMedium;
    return Text(
      text.toUpperCase(),
      style: GoogleFonts.montserrat(
        textStyle: (baseStyle ?? const TextStyle()).copyWith(
          color:
              this.color ??
              (theme == ThemeMode.dark
                  ? AppColors.whiteColor
                  : AppColors.darkBarBackgroundColor),
        ),
      ),
    );
  }
}

class StyledTitle extends StatelessWidget {
  final String text;
  final Color? color;

  const StyledTitle({Key? key, required this.text, this.color})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context).effectiveMode;
    final baseStyle = Theme.of(context).textTheme.titleMedium;
    return Text(
      text.toUpperCase(),
      style: GoogleFonts.montserrat(
        textStyle: baseStyle?.copyWith(
          color:
              this.color ??
              (theme == ThemeMode.dark
                  ? AppColors.whiteColor
                  : AppColors.darkBarBackgroundColor),
        ),
      ),
    );
  }
}
