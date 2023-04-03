class GameHistory {
  DateTime startTime;
  DateTime endTime;
  int score;
  bool hasAbandoned;
  bool isWinner;

  GameHistory({
    required this.startTime,
    required this.endTime,
    required this.score,
    required this.hasAbandoned,
    required this.isWinner,
  });

  GameHistory.fromJson(Map<String, dynamic> json)
      : this(
            startTime: DateTime.parse(json['startTime']),
            endTime: DateTime.parse(json['endTime']),
            score: json['score'],
            hasAbandoned: json['hasAbandoned'],
            isWinner: json['isWinner']);

  static List<GameHistory> fromJsonList(List<dynamic> list) {
    return list
        .map<GameHistory>(
            (json) => GameHistory.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
