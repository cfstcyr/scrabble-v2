import 'dart:async';

import 'package:mobile/controllers/game-creation-controller.dart';

import '../components/error-pop-up.dart';
import '../constants/locale/groups-constants.dart';
import '../locator.dart';
import '../routes/navigator-key.dart';

class GameCreationService {
  String? groupId;

  GameCreationService._privateConstructor();

  static final GameCreationService _instance =
      GameCreationService._privateConstructor();

  factory GameCreationService() {
    return _instance;
  }

  final gameCreationController = getIt.get<GameCreationController>();

  void handleStartGame() {
    if (groupId == null) return;

    gameCreationController.handleStartGame(groupId!).catchError((error) {
      errorSnackBar(navigatorKey.currentContext!, GAME_START_FAILED);
      return error;
    });
  }

  Future<String> createGame() async {
    String groupId = await gameCreationController.handleCreateGame();
    this.groupId = groupId;
    return groupId;
  }

  // Future<bool> startGame(PublicUser user, String gameId) async {
  //   return await gameCreationController.handleStartGame(user, gameId);
  // }
}
