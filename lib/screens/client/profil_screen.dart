import 'package:e_bricole/providers/ThemeProvider.dart';
import 'package:e_bricole/shared/styled_button.dart';
import 'package:e_bricole/shared/styled_card.dart';
import 'package:e_bricole/shared/styled_dialog.dart';
import 'package:e_bricole/shared/styled_text.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:io' show Platform;
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class ProfilScreen extends StatefulWidget {
  const ProfilScreen({super.key});

  @override
  State<ProfilScreen> createState() => _ProfilScreenState();
}

class _ProfilScreenState extends State<ProfilScreen> {
  bool _showNotifications = false;

  void _onLanguageTap(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder:
          (_) => StyledDialog(
            title: 'Choisir la langue',
            icon: Icon(
              Icons.info_outline_rounded,
              color: AppColors.primaryColor,
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                StyledText(text: 'Sélectionne une langue pour l’interface :'),
                const SizedBox(height: 12),
              ],
            ),
            actions: [
              StyledButton(
                onPressed: () => Navigator.pop(context),
                child: StyledHeading(
                  text: 'ANNULER',
                  color: AppColors.whiteColor,
                ),
              ),
            ],
          ),
    );
  }

  void _onNotificationsTap() {}

  // 2) Comment l’appeler depuis un onTap
  void _onThemeTap(
    BuildContext context,
    ThemeMode selected,
    ThemeProvider prov,
  ) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder:
          (_) => StyledDialog(
            title: 'Choisir un theme',
            icon: Icon(
              Icons.info_outline_rounded,
              color: AppColors.primaryColor,
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                StyledText(text: 'Sélectionne un theme pour l’interface :'),
                const SizedBox(height: 12),
                Column(
                  children:
                      ThemeMode.values.map((mode) {
                        String label;
                        switch (mode) {
                          case ThemeMode.system:
                            label = 'Système (default)';
                            break;
                          case ThemeMode.light:
                            label = 'Clair';
                            break;
                          case ThemeMode.dark:
                            label = 'Sombre';
                            break;
                        }
                        return RadioListTile<ThemeMode>(
                          title: StyledText(text: label),
                          value: mode,
                          groupValue: selected,
                          onChanged: (m) {
                            prov.setMode(m!);
                            Navigator.of(context).pop();
                          },
                        );
                      }).toList(),
                ),
              ],
            ),
            actions: [
              StyledButton(
                onPressed: () => Navigator.pop(context),
                child: StyledHeading(
                  text: 'ANNULER',
                  color: AppColors.whiteColor,
                ),
              ),
            ],
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeProv = context.read<ThemeProvider>();
    final currentMode = context.select<ThemeProvider, ThemeMode>((p) => p.mode);

    return Scaffold(
      body: Container(
        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        child: Column(
          children: [
            StyledCard(
              child: Column(
                children: [
                  Image.asset('assets/images/user.png', width: 60),
                  SizedBox(height: 20),
                  StyledHeading(text: 'Jhon Doe'),
                  StyledText(
                    text: 'j.doe@example.com',
                    // color: AppColors.textSecondaryColor,
                  ),
                  StyledButton(
                    onPressed: () {},
                    child: Row(
                      children: [
                        Icon(
                          Icons.update,
                          size: 30,
                          color: AppColors.whiteColor,
                        ),
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
            SizedBox(height: 10),
            StyledCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  StyledHeading(text: "Settings"),
                  SizedBox(height: 10),
                  Container(
                    height: 190,
                    child: ListView(
                      children: [
                        ListTile(
                          leading: Icon(
                            Icons.language,
                            color: AppColors.primaryColor,
                          ),
                          title: StyledHeading(text: 'Language'),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              StyledText(text: 'english'),
                              SizedBox(width: 8),
                              Icon(Icons.chevron_right),
                            ],
                          ),
                          onTap: () => _onLanguageTap(context),
                        ),
                        Divider(height: 1),
                        ListTile(
                          leading: Icon(
                            Icons.notifications,
                            color: AppColors.primaryColor,
                          ),
                          title: StyledHeading(text: 'Notifications'),
                          trailing:
                              Platform.isIOS
                                  ? CupertinoSwitch(
                                    value: _showNotifications,
                                    onChanged:
                                        (bool newValue) =>
                                            setState(() => _showNotifications = newValue),
                                  )
                                  : Switch(
                                    value: _showNotifications,
                                    onChanged:
                                        (bool newValue) =>
                                            setState(() => _showNotifications = newValue),
                                  ),
                        ),
                        Divider(height: 1),
                        ListTile(
                          leading: Icon(
                            Icons.palette,
                            color: AppColors.primaryColor,
                          ),
                          title: StyledHeading(text: 'Theme'),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              StyledText(
                                text:
                                    currentMode.toString().split(
                                      'ThemeMode.',
                                    )[1],
                              ),
                              SizedBox(width: 8),
                              Icon(Icons.chevron_right),
                            ],
                          ),
                          onTap:
                              () =>
                                  _onThemeTap(context, currentMode, themeProv),
                        ),
                        Divider(height: 1),
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
