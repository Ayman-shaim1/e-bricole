import 'package:e_bricole/shared/styled_text.dart';
import 'package:flutter/material.dart';

class RequestsScreen extends StatelessWidget {
  const RequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: StyledHeading(text: "requests")));
  }
}
