// 1) Le widget de ton dialogue custom
import 'package:e_bricole/shared/styled_text.dart';
import 'package:e_bricole/theme.dart';
import 'package:flutter/material.dart';

class StyledDialog extends StatelessWidget {
  final String title;
  final Widget content;
  final List<Widget> actions;
  final Icon? icon;

  const StyledDialog({
    Key? key,
    required this.title,
    required this.content,
    required this.actions,
    this.icon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      child: ConstrainedBox(
        constraints: BoxConstraints(minWidth: 285),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // En-tête
            Container(
              height: 13,
              decoration: BoxDecoration(
                color: AppColors.primaryColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(4),
                  // bottomLeft et bottomRight par défaut à Radius.zero
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              child: Row(
                children: [
                  if (icon != null) icon!,
                  if (icon != null) const SizedBox(width: 12),
                  Expanded(child: StyledHeading(text: title)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Contenu
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: content,
            ),
            const SizedBox(height: 24),
            // Actions (boutons)
            ButtonBar(alignment: MainAxisAlignment.end, children: actions),
          ],
        ),
      ),
    );
  }
}
