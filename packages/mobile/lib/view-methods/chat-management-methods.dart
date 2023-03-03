import 'package:flutter/material.dart';

import '../constants/chat-management.constants.dart';

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
