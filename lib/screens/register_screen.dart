import 'package:e_bricole/shared/styled_container.dart';
import 'package:e_bricole/shared/styled_text.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  bool isClient = true;
  final TextEditingController _emailController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return StyledContainer(
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Image.asset("assets/images/main_logo.png", width: 100),
            ),
            Center(child: StyledTitle(text: "Sign up here !")),
            SizedBox(height: 10),
            Center(child: StyledText(text: "Welcome to e-bricole")),
            Center(child: StyledText(text: "Please enter your information to")),
            Center(child: StyledText(text: "create your account")),
            SizedBox(height: 20),

            // Artisan / Client Toggle
            Container(
              padding: EdgeInsets.all(10),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.all(Radius.circular(30)),
                color: AppColors.lightGrayColor,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => isClient = true),
                      child: Container(
                        padding: EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color:
                              isClient
                                  ? AppColors.whiteColor
                                  : AppColors.lightGrayColor,
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: Center(child: StyledText(text: "As a Client")),
                      ),
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => isClient = false),
                      child: Container(
                        padding: EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color:
                              !isClient
                                  ? AppColors.whiteColor
                                  : AppColors.lightGrayColor,
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: Center(child: StyledText(text: "As an Artisan")),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 20),
            _renderForm(),
          ],
        ),
      ),
    );
  }

  Widget _renderForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        StyledText(text: 'Email:'),
        SizedBox(height: 10),
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            prefixIcon: Icon(Icons.email),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(25)),
            hintText: 'j.doe@example.com',
            contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          ),
        ),
        SizedBox(height: 20),
      ],
    );
  }
}
