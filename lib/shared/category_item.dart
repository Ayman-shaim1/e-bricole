
import 'package:e_bricole/shared/styled_text.dart';
import 'package:flutter/material.dart';


class CategorieItem extends StatelessWidget {
  final String image;
  final String name;

  const CategorieItem({Key? key, required this.image, required this.name})
    : super(key: key);
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: EdgeInsets.all(12),
          margin: EdgeInsets.symmetric(horizontal: 7),
          decoration: BoxDecoration(
            color: const Color(0xFFE0E0E0),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Image.asset('$image', width: 55),
        ),
        StyledText(text: '$name'),
      ],
    );
  }
}
