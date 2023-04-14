import 'package:flutter/material.dart';
import 'package:mobile/components/alert-dialog.dart';
import 'package:mobile/components/app_button.dart';
import 'package:mobile/locator.dart';
import 'package:mobile/services/theme-color-service.dart';

void openEditTheme(BuildContext context) {
  triggerDialogBox('Veuillez choisir un thème', [
    EditTheme()
  ], [
    DialogBoxButtonParameters(
        content: 'Confirmer', theme: AppButtonTheme.primary, closesDialog: true)
  ]);
}

class EditTheme extends StatelessWidget {
  const EditTheme({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
        child: StreamBuilder(
            stream: getIt.get<ThemeColorService>().themeDetails.stream,
            builder: (context, snapshot) {
              ThemeColor themeColor = snapshot.data?.color ?? ThemeColor.green;
              return Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      ColorOption(
                        themeColor: themeColor,
                        optionColor: ThemeColor.green,
                      ),
                      SizedBox(width: 20),
                      ColorOption(
                        themeColor: themeColor,
                        optionColor: ThemeColor.blue,
                      ),
                      SizedBox(width: 20),
                      ColorOption(
                        themeColor: themeColor,
                        optionColor: ThemeColor.purple,
                      ),
                    ],
                  ),
                  SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      ColorOption(
                        themeColor: themeColor,
                        optionColor: ThemeColor.pink,
                      ),
                      SizedBox(width: 20),
                      ColorOption(
                        themeColor: themeColor,
                        optionColor: ThemeColor.red,
                      ),
                      SizedBox(width: 20),
                      ColorOption(
                        themeColor: themeColor,
                        optionColor: ThemeColor.black,
                      ),
                    ],
                  ),
                ],
              );
            }));
  }
}

class ColorOption extends StatelessWidget {
  const ColorOption({
    super.key,
    required this.themeColor,
    required this.optionColor,
  });

  final ThemeColor themeColor;
  final ThemeColor optionColor;

  @override
  Widget build(BuildContext context) {
    return Transform.scale(
      scale: themeColor == optionColor ? 1.1 : 1,
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(
              color: themeColor == optionColor
                  ? Colors.blueGrey.shade600
                  : Colors.transparent,
              width: 2),
          borderRadius: BorderRadius.all(Radius.circular(100)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            getIt
                .get<ThemeColorService>()
                .themeDetails
                .add(setTheme(optionColor));
          },
          splashColor: Colors.transparent,
          child: Opacity(
            opacity: themeColor == optionColor ? 1 : 0.8,
            child: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                    shape: BoxShape.circle, color: optionColor.colorValue)),
          ),
        ),
      ),
    );
  }
}
