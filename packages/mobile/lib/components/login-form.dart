// ignore_for_file: prefer_const_constructors

import 'package:flutter/material.dart';
import 'package:mobile/classes/login.dart';
import 'package:mobile/classes/text-field-handler.dart';
import 'package:mobile/components/app_button.dart';
import 'package:mobile/locator.dart';
import 'package:mobile/routes/routes.dart';
import 'package:mobile/services/theme-color-service.dart';

import '../classes/user.dart';
import '../constants/create-account-constants.dart';
import '../constants/login-constants.dart';
import '../controllers/account-authentification-controller.dart';
import '../services/socket.service.dart';

class LoginForm extends StatefulWidget {
  @override
  _LoginFormState createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  bool isPasswordShown = false;
  bool isFirstSubmit = true;

  bool get isButtonEnabled => isFirstSubmit;
  SocketService socketService = getIt.get<SocketService>();
  Color themeColor =
      getIt.get<ThemeColorService>().themeDetails.value.color.colorValue;
  AccountAuthenticationController authController =
      getIt.get<AccountAuthenticationController>();

  final emailHandler = TextFieldHandler();
  final passwordHandler = TextFieldHandler();

  @override
  void initState() {
    super.initState();
    emailHandler.addListener(validateEmail);
  }

  @override
  void dispose() {
    emailHandler.dispose();
    passwordHandler.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    var theme = Theme.of(context);
    var style = theme.textTheme.displayMedium!.copyWith(
      color: theme.colorScheme.onPrimary,
    );
    return Column(
      children: [
        SizedBox(height: 20),
        Padding(padding: EdgeInsets.only(top: 0)),
        Container(
          height: 353,
          width: 580,
          decoration: BoxDecoration(
              border: Border.all(
                color: theme.colorScheme.onPrimary,
              ),
              borderRadius: BorderRadius.circular(5)),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(children: [
                Padding(
                  padding: EdgeInsets.only(
                      left: 15.0, right: 15.0, top: 15.0, bottom: 0),
                  child: TextField(
                    controller: emailHandler.controller,
                    focusNode: emailHandler.focusNode,
                    obscureText: false,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(),
                      labelText: EMAIL_LABEL_FR,
                      errorText: emailHandler.errorMessage.isEmpty
                          ? null
                          : emailHandler.errorMessage,
                    ),
                  ),
                ),
                SizedBox(height: 15),
                Padding(
                  padding: EdgeInsets.only(
                      left: 15.0, right: 15.0, top: 15.0, bottom: 0),
                  child: TextField(
                    controller: passwordHandler.controller,
                    focusNode: passwordHandler.focusNode,
                    keyboardType: TextInputType.visiblePassword,
                    obscureText: !isPasswordShown,
                    onSubmitted: (data) async => goNext(context),
                    decoration: InputDecoration(
                      border: OutlineInputBorder(),
                      labelText: PASSWORD_LABEL_FR,
                      errorText: passwordHandler.errorMessage.isEmpty
                          ? null
                          : passwordHandler.errorMessage,
                    ),
                  ),
                ),
                CheckboxListTile(
                  title: Text(CHECKBOX_SHOW_PASSWORD_LABEL_FR),
                  value: isPasswordShown,
                  onChanged: (bool? value) {
                    setState(() {
                      isPasswordShown = value!;
                    });
                  },
                  controlAffinity: ListTileControlAffinity.leading,
                ),
                AppButton(
                    onPressed: () async => goNext(context),
                    text: LOGIN_LABEL_FR),
                AppButton(
                    onPressed: () => Navigator.pushNamed(context, SIGNUP_ROUTE),
                    text: CREATE_ACCOUNT_LABEL_FR)
              ]),
            ],
          ),
        )
      ],
    );
  }

  void goNext(BuildContext context) async {
    if (await isLoggedIn(UserLoginCredentials(
        email: emailHandler.controller.text,
        password: passwordHandler.controller.text))) {
      if (context.mounted) {
        Navigator.of(context).pushReplacementNamed(HOME_ROUTE);
      }
    }
  }

  bool validation(String email) {
    return RegExp(r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+")
        .hasMatch(email);
  }

  Future<void> validateEmail() async {
    if (emailHandler.controller.text.isEmpty) {
      setState(() {
        emailHandler.errorMessage = EMAIL_EMPTY_FR;
      });
    } else if (!validation(emailHandler.controller.text)) {
      setState(() {
        emailHandler.errorMessage = EMAIL_INVALID_FORMAT_FR;
      });
    } else {
      setState(() {
        emailHandler.errorMessage = "";
      });
    }
  }

  Future<bool> isLoggedIn(UserLoginCredentials credentials) async {
    LoginResponse res = await authController.login(credentials);
    if (!res.isAuthorized) {
      setState(() {
        passwordHandler.errorMessage = res.errorMessage;
      });
    }
    return res.isAuthorized;
  }
}
