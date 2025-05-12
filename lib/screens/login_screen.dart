import 'package:e_bricole/shared/styled_button.dart';
import 'package:e_bricole/shared/styled_card.dart';
import 'package:e_bricole/shared/styled_text.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(top: 75),
      child: StyledCard(
        height: 650,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Image.asset("assets/images/main_logo.png", width: 80),
            ),
            Center(child: StyledHeading(text: "Login here !")),
            SizedBox(height: 10),
            Center(child: StyledText(text: "Welcome back to e-bricole")),
            SizedBox(height: 30),
            StyledText(text: 'email:'),
            SizedBox(height: 5),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                prefixIcon: Icon(Icons.email),
                border: OutlineInputBorder(),
                hintText: 'j.doe@example.com',
              ),
            ),
            SizedBox(height: 10),
            StyledText(text: 'password:'),
            SizedBox(height: 5),
            TextField(
              controller: _passwordController,
              obscureText: _obscurePassword,
              decoration: InputDecoration(
                prefixIcon: Icon(Icons.lock),
                border: OutlineInputBorder(),
                hintText: '*********',
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility_off : Icons.visibility,
                  ),
                  onPressed: () {
                    setState(() {
                      _obscurePassword = !_obscurePassword;
                    });
                  },
                ),
              ),
            ),
            SizedBox(height: 20),
            StyledButton(
              onPressed: () {},
              child: StyledHeading(text: "login", color: AppColors.whiteColor),
            ),
            SizedBox(height: 5),
            Divider(),
            SizedBox(height: 10),
            StyledButton(
              onPressed: () {},
              child: StyledHeading(
                text: "login with google account",
                color: AppColors.whiteColor,
              ),
            ),
            SizedBox(height: 20),
            StyledButton(
              onPressed: () {},
              child: StyledHeading(
                text: "login with facebook account",
                color: AppColors.whiteColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
