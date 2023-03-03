import 'package:flutter/material.dart';
import 'package:mobile/constants/login-constants.dart';
import 'package:mobile/pages/prototype-page.dart';

import '../components/scaffold-persistance.dart';
import '../controllers/account-authentification-controller.dart';
import '../locator.dart';
import '../main.dart';

class HomePage extends StatefulWidget {
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  var selectedIndex = 0;

  final _loginScreen = GlobalKey<NavigatorState>();
  final _createAccountScreen = GlobalKey<NavigatorState>();
  final _homePageScreen = GlobalKey<NavigatorState>();
  final AccountAuthenticationController authService =
      getIt.get<AccountAuthenticationController>();
  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        handleBackButton(context);
        return true;
      },
      child: MyScaffold(
        title: "Home",
        body: IndexedStack(
          index: selectedIndex,
          children: <Widget>[
            Navigator(
              key: _loginScreen,
              onGenerateRoute: (route) => MaterialPageRoute(
                settings: route,
                builder: (context) => PrototypePage(),
              ),
            )
          ],
        ),
      ),
    );
  }

  handleBackButton(BuildContext context) {
    showDialog<String>(
      context: context,
      builder: (BuildContext context) => AlertDialog(
        title: Text(CONFIRMATION_BACK_BUTTON_DIALOG_TITLE),
        content: const Text(BACK_BUTTON_SIGNOUT_CONFIRMATION_FR),
        actions: <Widget>[
          TextButton(
            onPressed: () => {authService.signOut()},
            child: Row(
              children: [
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => HomePage()));
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    shadowColor: Color.fromARGB(177, 0, 0, 0),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(3.0),
                    ),
                  ),
                  child: Text(CANCEL_BACK_BUTTON_FR,
                      style: TextStyle(color: Colors.white, fontSize: 15)),
                ),
                SizedBox(width: 10),
                ElevatedButton(
                  onPressed: () {
                    authService.signOut();
                    Navigator.push(context,
                        MaterialPageRoute(builder: (context) => MainPage()));
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    shadowColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(3.0),
                    ),
                  ),
                  child: Text(SIGNOUT_CONFIRMATION_LABEL_FR,
                      style: TextStyle(color: Colors.white, fontSize: 15)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MainTitle extends StatelessWidget {
  const MainTitle({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    var theme = Theme.of(context);
    var style = theme.textTheme.displayMedium!.copyWith(
      color: theme.colorScheme.onPrimary,
    );
    return Card(
      color: theme.colorScheme.primary,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Text('Bravo, vous êtes connectés!', style: style),
      ),
    );
  }
}
