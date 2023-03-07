// ignore_for_file: prefer_const_constructors, prefer_const_literals_to_create_immutables

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile/classes/login.dart';
import 'package:mobile/locator.dart';
import 'package:mobile/pages/home-page.dart';
import 'package:mobile/pages/login-page.dart';
import 'package:mobile/routes/navigator-key.dart';
import 'package:mobile/routes/routes.dart';
import 'package:provider/provider.dart';

import 'controllers/account-authentification-controller.dart';
import 'environments/environment.dart';

Future<void> main() async {
  await dotenv.load(fileName: ".env");
  const String environment = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: Environment.DEV,
  );
  Environment().initConfig(environment);
  CustomLocator().setUpLocator();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  AccountAuthenticationController authController =
      getIt.get<AccountAuthenticationController>();
  MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Widget>(
      future: getEntryPage(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          // Return a loading indicator while the future is being fetched
          return CircularProgressIndicator();
        } else {
          return ChangeNotifierProvider(
            create: (context) => MyAppState(),
            child: MaterialApp(
              title: 'Namer App',
              theme: ThemeData(
                  useMaterial3: true,
                  scaffoldBackgroundColor: Colors.white,
                  colorScheme: ColorScheme.fromSeed(
                      seedColor: Color.fromRGBO(27, 94, 32, 1),
                      background: Color.fromRGBO(243, 243, 243, 1),
                      onBackground: Color.fromRGBO(232, 232, 232, 1),
                      tertiary: Color.fromRGBO(216, 216, 216, 1)),
                  cardTheme: CardTheme(
                      color: Colors.white, surfaceTintColor: Colors.white)),
              navigatorKey: navigatorKey,
              home: snapshot.data,
              routes: ROUTES,
            ),
          );
        }
      },
    );
  }

  Future<Widget>? getEntryPage() async {
    TokenValidation tokenValidation = await authController.validateToken();
    switch (tokenValidation) {
      case TokenValidation.Ok:
        {
          return HomePage();
        }

      case TokenValidation.NoToken:
        {
          return MainPage();
        }
      default:
        {
          return MainPage();
        }
    }
  }
}

class MyAppState extends ChangeNotifier {}

class MainPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return LoginPage();
  }
}
