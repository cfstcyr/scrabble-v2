// ignore_for_file: non_constant_identifier_names, constant_identifier_names

import 'package:flutter/material.dart';
import 'package:mobile/classes/group.dart';
import 'package:mobile/pages/create-account-page.dart';
import 'package:mobile/pages/create-game-page.dart';
import 'package:mobile/pages/game-page.dart';
import 'package:mobile/pages/groups-page.dart';
import 'package:mobile/pages/home-page.dart';
import 'package:mobile/pages/join-waiting-page.dart';
import 'package:mobile/pages/login-page.dart';
import 'package:mobile/pages/profile-edit-page.dart';
import 'package:mobile/pages/profile-page.dart';
import 'package:mobile/pages/puzzle-page.dart';

import '../pages/create-lobby.dart';
import '../pages/groups-request-waiting-page.dart';
import '../pages/profile-search-page.dart';

const BASE_ROUTE = '/';
const LOGIN_ROUTE = '/login';
const SIGNUP_ROUTE = '/signup';
const HOME_ROUTE = '/home';
const GROUPS_ROUTE = '/groups';
const CREATE_LOBBY_ROUTE = '/create-lobby';
const JOIN_WAITING_ROUTE = '/join-waiting-room';
const JOIN_LOBBY_ROUTE = '/join-lobby';
const CREATE_GAME = "/create-game";
const GAME_PAGE_ROUTE = '/game';
const PROFILE_ROUTE = '/profile';
const PROFILE_EDIT_ROUTE = '/edit-profile';
const PROFILE_SEARCH_ROUTE = '/search-profile';
const PUZZLE_ROUTE = '/puzzle';

final ROUTES = {
  BASE_ROUTE: (context) => HomePage(),
  LOGIN_ROUTE: (context) => LoginPage(),
  SIGNUP_ROUTE: (context) => CreateAccountPage(),
  CREATE_GAME: (context) => CreateGamePage(),
  HOME_ROUTE: (context) => HomePage(),
  GROUPS_ROUTE: (context) => GroupPage(),
  GAME_PAGE_ROUTE: (context) => GamePage(),
  PROFILE_ROUTE: (context) => ProfilePage(),
  PROFILE_EDIT_ROUTE: (context) => ProfileEditPage(),
  PROFILE_SEARCH_ROUTE: (context) => ProfileSearchPage(),
  PUZZLE_ROUTE: (context) => PuzzlePage(),
};

Route<dynamic>? customOnGenerateRoute(RouteSettings settings) {
  switch (settings.name) {
    case (CREATE_LOBBY_ROUTE):
      return MaterialPageRoute(builder: (context) {
        return CreateLobbyPage(group: settings.arguments as Group);
      });
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
