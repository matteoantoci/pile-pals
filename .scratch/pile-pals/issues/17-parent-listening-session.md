# 17: Parent listening session

Spec: [spec.md](../spec.md)

**What to build:** the Parent listens to the sounds that the agent marked as a doubt and chooses one for each. The game already plays the first choice of the agent, so this ticket blocks no other ticket.

**Blocked by:** 05 (Card sound effects), 13 (Pal sounds)

**Status:** ready-for-human

- [ ] Open the listening page `/listen/` on the iPhone, not on the Mac, because the game plays through the iPhone speaker.
- [ ] Listen to each `doubt` slot and tap keep or replace. The `sure` slots are optional.
- [ ] Tap Copy answers and paste the text under `## Comments` in this file.
- [ ] The agent ships the chosen files, sets their levels with the method of ticket 05, and updates the credits list.
