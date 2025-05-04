import 'package:e_bricole/shared/category_item.dart';
import 'package:e_bricole/shared/notifications.dart';
import 'package:e_bricole/shared/styled_button.dart';
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
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color.fromARGB(255, 255, 255, 255),
            borderRadius: BorderRadius.circular(8),
          ),
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
                  children: [
                    CategorieItem(
                      image: 'assets/icons/jardinier.png',
                      name: 'Gardener',
                    ),
                    CategorieItem(
                      image: 'assets/icons/menage.png',
                      name: 'Cleaner',
                    ),
                    CategorieItem(
                      image: 'assets/icons/plombier.png',
                      name: 'Plumber',
                    ),
                    CategorieItem(
                      image: 'assets/icons/electricien.png',
                      name: 'Electrician',
                    ),
                    CategorieItem(
                      image: 'assets/icons/menuisier.png',
                      name: 'Joiner',
                    ),
                  ],
                ),
              ),
              SizedBox(height: 14),
              StyledButton(
                onPressed: () {},
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
      ),
    );
  }
}
