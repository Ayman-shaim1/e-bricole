import 'package:e_bricole/models/category_model.dart';
import 'package:e_bricole/screens/client/categories_screen.dart';
import 'package:e_bricole/shared/category_item.dart';
import 'package:e_bricole/shared/styled_button.dart';
import 'package:e_bricole/shared/styled_card.dart';
import 'package:e_bricole/shared/styled_text.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        child: Column(
          children: [
            StyledCard(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  StyledHeading(text: "Popular Categories"),
                  SizedBox(height: 14),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children:
                          Category.categories.map((item) {
                            return CategorieItem(
                              image: item.image,
                              name: item.name,
                            );
                          }).toList(),
                    ),
                  ),
                  SizedBox(height: 14),
                  StyledButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => CategoriesScreen(),
                        ),
                      );
                    },
                    child: Row(
                      children: [
                        Icon(Icons.menu, size: 30, color: AppColors.whiteColor),
                        SizedBox(width: 10),
                        StyledHeading(
                          text: 'explore all categories',
                          color: AppColors.whiteColor,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
