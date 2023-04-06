import 'package:flutter/material.dart';
import 'package:mobile/classes/abstract-game.dart';
import 'package:mobile/classes/board/position.dart';
import 'package:mobile/classes/game/game.dart';
import 'package:mobile/classes/tile/square.dart';
import 'package:mobile/classes/vector.dart';
import 'package:mobile/components/game/game_square.dart';
import 'package:mobile/constants/layout.constants.dart';
import 'package:mobile/locator.dart';
import 'package:mobile/services/game.service.dart';
import 'package:rxdart/rxdart.dart';

import '../../constants/game.constants.dart';

class GameBoard extends StatelessWidget {

  GameBoard({required this.gameStream, this.isInteractable = true, this.size = 630});

  final Stream<AbstractGame?> gameStream;
  final bool isInteractable;
  double size;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Container(
        padding: EdgeInsets.all(SPACE_2),
        child: AspectRatio(
          aspectRatio: 1,
          child: StreamBuilder<AbstractGame?>(
            stream: gameStream,
            builder: (context, snapshot) {
              return GridView.count(
                crossAxisCount: GRID_SIZE,
                physics: NeverScrollableScrollPhysics(),
                mainAxisSpacing: SPACE_1 / 2,
                crossAxisSpacing: SPACE_1 / 2,
                shrinkWrap: true,
                childAspectRatio: 1,
                children: List.generate(GRID_SIZE * GRID_SIZE, (index) {
                  var position = Position.fromVec2(Vec2.from1D(index));
                  return GameSquare(
                    tileRack: snapshot.hasData ? snapshot.data!.tileRack : null,
                    square: snapshot.data?.board.getSquare(position) ??
                        Square(position: Position(0, 0)),
                    boardSize: size,
                    isInteractable: isInteractable,
                  );
                }),
              );
            },
          ),
        ),
      ),
    );
  }
}
