// ignore_for_file: non_constant_identifier_names, constant_identifier_names

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:mobile/classes/group.dart';
import 'package:mobile/pages/join-waiting-page.dart';
import 'package:mobile/pages/groups-page.dart';
import 'package:mobile/pages/game-page.dart';
import 'package:mobile/pages/home-page.dart';
import 'package:mobile/pages/login-page.dart';
import 'package:mobile/pages/profile-edit-page.dart';
import 'package:mobile/pages/profile-page.dart';

import '../main.dart';
import '../pages/create-lobby.dart';
import '../pages/groups-request-waiting-page.dart';

const HOME_ROUTE = '/';
const GROUPS_ROUTE = '/groups';
const CREATE_LOBBY_ROUTE = '/create-lobby';
const JOIN_WAITING_ROUTE = '/join-waiting-room';
const JOIN_LOBBY_ROUTE = '/join-lobby';
const MAIN_PAGE = '/main';
const GAME_PAGE_ROUTE = '/game';
const PROFILE_ROUTE = '/profile';
const PROFILE_EDIT_ROUTE = '/edit-profile';

final ROUTES = {
  MAIN_PAGE: (context) => MainPage(),
  HOME_ROUTE: (context) => HomePage(),
  GROUPS_ROUTE: (context) => GroupPage(),
  CREATE_LOBBY_ROUTE: (context) => CreateLobbyPage(),
  GAME_PAGE_ROUTE: (context) => GamePage(),
  PROFILE_ROUTE: (context) => ProfilePage(),
  PROFILE_EDIT_ROUTE: (context) => ProfileEditPage(),
};

Route<dynamic>? customOnGenerateRoute(RouteSettings settings) {
  switch (settings.name) {
    case (JOIN_WAITING_ROUTE):
      return MaterialPageRoute(builder: (context) {
        return GroupRequestWaitingPage(group: settings.arguments as Group);
      });
    case (JOIN_LOBBY_ROUTE):
      return MaterialPageRoute(builder: (context) {
        return JoinWaitingPage(currentGroup: settings.arguments as Group);
      });
    default:
      return null;
  }
}
