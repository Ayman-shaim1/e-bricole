import 'package:e_bricole/shared/styled_button.dart';
import 'package:e_bricole/shared/styled_text.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';

class ProfilScreen extends StatelessWidget {
  const ProfilScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color.fromARGB(255, 255, 255, 255),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Image.asset('assets/images/default_user.png', width: 60),
                  SizedBox(height: 20),
                  StyledHeading(text: 'Jhon Doe'),
                  StyledText(
                    text: 'j.doe@example.com',
                    color: AppColors.textSecondaryColor,
                  ),
                  StyledButton(
                    onPressed: () {},
                    child: Row(
                      children: [
                        Icon(Icons.update, size: 30, color: AppColors.whiteColor),
                        SizedBox(width: 10),
                        StyledHeading(
                          text: 'update infomrations',
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
