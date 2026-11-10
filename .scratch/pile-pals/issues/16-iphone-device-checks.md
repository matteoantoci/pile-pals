# 16: iPhone device checks

Spec: [spec.md](../spec.md)

**What to build:** the Parent checks on the iPhone 12 with iOS 26 the things that no code test can check. The results go into this ticket, and the agent changes the code where a check fails.

**Blocked by:** 01 (Tracer bullet: one level on the iPhone), 04 (Native drag feel), 05 (Card sound effects), 08 (Group and level celebrations), 09 (Save, restore, and the shell), 11 (Sticker book reward)

**Status:** ready-for-human

## Setup (one time, 5 minutes)

1. On the iPhone: Settings → Apps → Safari → Advanced → turn on Web Inspector.
2. On the Mac: Safari → Settings → Advanced → turn on "Show features for web developers".
3. Connect the iPhone with a cable. Open the game from the home screen. On the Mac, select Develop → the iPhone → Pile Pals.
4. Write the iOS version (Settings → General → About) in the results table.

## Checks

- [ ] The app installs from Safari to the home screen and opens with no browser bars.
- [ ] The drag feels native: lift, follow, snap, and shake back.
- [ ] With the silent switch on, record whether the game plays sound.
- [ ] Frame drops: in Web Inspector → Timelines → Rendering Frames, record a 5-second drag with 1, 4, and 8 animated pictures. A count passes when no frame is longer than 33 ms and at most 3 frames are longer than 16.7 ms. The maximum number of animations at the same time is the highest count that passes. If 8 passes, also test 12.
- [ ] Offline: the first install on Wi-Fi finishes. Then a full level plays in airplane mode. Ticket 02 records the download size, and the limit is 150 MB.
- [ ] The 11 checks in `research/native-feel/shell.md`, section "Must be measured on the device". Examples: white flash at launch, audio after a phone call, update timing, and edge swipe.
- [ ] The 7 checks in `research/native-feel/motion.md`, section "Must be measured on the device". Examples: layer memory with 20 to 30 cards, blur, and the flip.

## Results

Write one row for each check. A failed check needs a note of what you saw.

| Check | Pass or fail | Value or note |
|---|---|---|
