import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mobile/classes/channel.dart';
import 'package:rxdart/rxdart.dart';

import '../constants/chat-management.constants.dart';
import '../locator.dart';
import '../services/socket.service.dart';

List<Channel> channels = [DEFAULT_CHANNEL];
List<Channel> myChannels = [DEFAULT_CHANNEL];
BehaviorSubject<List<Channel>> channels$ =
    BehaviorSubject<List<Channel>>.seeded(channels);
BehaviorSubject<List<Channel>> myChannels$ =
    BehaviorSubject<List<Channel>>.seeded(myChannels);
BehaviorSubject<bool> shouldOpen$ = BehaviorSubject<bool>.seeded(false);
BehaviorSubject<Channel> channelToOpen$ =
    BehaviorSubject<Channel>.seeded(channels[0]);
SocketService socketService = getIt.get<SocketService>();

var inputController = TextEditingController();
var searchController = TextEditingController();
List<Channel> channelSearchResult = [];

Future<void> createChannel(String channelName) async {
  if (channelName.isEmpty) return;
  socketService.emitEvent('channel:newChannel', ChannelName(name: channelName));
}

Future<void> joinChannel(int idChannel) async {
  socketService.emitEvent('channel:join', idChannel);
}

Future<void> quitChannel(int idChannel) async {
  socketService.emitEvent('channel:quit', idChannel);
}

Future<void> getAllChannels() async {
  SocketService.socket.emit('channel:allChannels');
}

List<Channel> handleUnjoinedChannels() {
  List<Channel> unjoinedChannels = [...channels];
  myChannels.forEach((myChannel) {
    unjoinedChannels.removeWhere((channel) {
      return channel.name == myChannel.name && !channel.private;
    });
  });
  channelSearchResult = [...unjoinedChannels];
  return channelSearchResult;
}

OutlineInputBorder setCreateChannelBorder() {
  return OutlineInputBorder(
    borderRadius: BorderRadius.circular(4),
    borderSide: BorderSide(
      color: Colors.black,
      width: 1,
      style: BorderStyle.solid,
    ),
  );
}

SizedBox setDrawerTitle() {
  return SizedBox(
    height: 90,
    child: DrawerHeader(
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
      ),
      child: Text(CHANNELS_TITLE),
    ),
  );
}

setName(String name) {
  return Text(
    name,
    overflow: TextOverflow.ellipsis,
    style: TextStyle(fontSize: 17),
  );
}

Divider setDivider() {
  return Divider(
    height: 10,
    thickness: 2,
    indent: 15,
    endIndent: 15,
    color: Colors.grey.shade500,
  );
}
