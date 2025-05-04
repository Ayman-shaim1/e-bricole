import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class StyledText extends StatelessWidget {
  final String text;
  final Color? color;

  const StyledText({
    Key? key,
    required this.text,
    this.color,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final baseStyle = Theme.of(context).textTheme.bodyMedium;
    return Text(
      text,
      style: GoogleFonts.montserrat(
        textStyle: baseStyle?.copyWith(color: color ?? baseStyle?.color),
      ),
    );
  }
}

class StyledHeading extends StatelessWidget {
  final String text;
  final Color? color;

  const StyledHeading({
    Key? key,
    required this.text,
    this.color,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final baseStyle = Theme.of(context).textTheme.headlineMedium;
    return Text(
      text.toUpperCase(),
      style: GoogleFonts.montserrat(
        textStyle: baseStyle?.copyWith(color: color ?? baseStyle?.color),
      ),
    );
  }
}

class StyledTitle extends StatelessWidget {
  final String text;
  final Color? color;

  const StyledTitle({
    Key? key,
    required this.text,
    this.color,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final baseStyle = Theme.of(context).textTheme.titleMedium;
    return Text(
      text.toUpperCase(),
      style: GoogleFonts.montserrat(
        textStyle: baseStyle?.copyWith(color: color ?? baseStyle?.color),
      ),
    );
  }
}
