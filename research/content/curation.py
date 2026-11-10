"""Which Fluent Emoji folders become picture cards for a 4-5-year-old.

Every decision here is a hand judgement (unverified: no study tested these
exact pictures with children). The rules are written down so they can be
reviewed and re-run. Keys are the exact folder names under `assets/`.

Reason codes:
  flag          a flag
  symbol        sign, arrow, letter, number, UI icon, zodiac, suit
  face          emoji face or heart (kept only for the "feelings" type)
  gesture       hand gesture
  person        person/activity emoji not in the keep list
  gender_dup    "Man X" / "Woman X" copy of a neutral "Person X"/"X"
  duplicate     a second picture of the same thing (for example "Cat face" next to "Cat")
  clock_time    clock face that shows a time of day
  moon_phase    moon phase other than full and crescent
  religious     religious building or object
  culture       object a European pre-schooler is unlikely to know
  adult         alcohol, tobacco, gambling, money, paperwork
  scary         death, weapons, injury
  abstract      shows an idea or a part, not a whole thing
  unfamiliar    real thing, but too rare for this age
"""

DROP_GROUPS = {"Flags": "flag", "Symbols": "symbol"}

# Groups where everything is dropped unless listed here.
KEEP_ONLY = {
    "Smileys & Emotion": {
        # fantasy/characters
        "Ghost", "Robot", "Alien", "Clown face",
        # feelings, happy side (one valence)
        "Grinning face", "Grinning face with big eyes", "Grinning face with smiling eyes",
        "Beaming face with smiling eyes", "Smiling face with smiling eyes",
        "Slightly smiling face", "Grinning squinting face", "Smiling face",
        # feelings, sad side (other valence)
        "Crying face", "Loudly crying face", "Disappointed face", "Pensive face",
        "Frowning face", "Slightly frowning face", "Worried face", "Weary face",
    },
    "People & Body": {
        # body parts
        "Ear", "Eye", "Nose", "Mouth", "Tooth", "Foot", "Leg", "Tongue", "Bone",
        "Raised hand", "Flexed biceps",
        # people
        "Baby", "Child", "Older person",
        # helpers / jobs (neutral versions only)
        "Firefighter", "Police officer", "Cook", "Farmer", "Health worker",
        "Astronaut", "Pilot", "Teacher", "Construction worker", "Mechanic",
        "Scientist", "Artist", "Singer", "Detective",
        # story characters
        "Santa claus", "Prince", "Princess", "Person fairy", "Person mage",
        "Person merpeople", "Person superhero", "Person elf", "Ninja",
        # doing things
        "Person swimming", "Person surfing", "Person biking", "Skier",
        "Snowboarder", "Person rowing boat", "Person in bed", "Person taking bath",
        "Person running",
    },
}

DROP = {
    # ---------------- Activities
    "1st place medal": "duplicate", "2nd place medal": "duplicate", "3rd place medal": "duplicate",
    "Admission tickets": "duplicate", "Bullseye": "unfamiliar", "Carp streamer": "culture",
    "Chess pawn": "abstract", "Club suit": "symbol", "Diamond suit": "symbol",
    "Heart suit": "symbol", "Spade suit": "symbol", "Confetti ball": "culture",
    "Cricket game": "unfamiliar", "Curling stone": "unfamiliar", "Field hockey": "unfamiliar",
    "Firecracker": "culture", "Flag in hole": "unfamiliar", "Flower playing cards": "culture",
    "Hamsa": "religious", "Ice hockey": "unfamiliar", "Japanese dolls": "culture",
    "Joker": "adult", "Joystick": "duplicate", "Knot": "abstract", "Lacrosse": "unfamiliar",
    "Mahjong red dragon": "culture", "Martial arts uniform": "unfamiliar",
    "Military medal": "scary", "Mirror ball": "unfamiliar", "Moon viewing ceremony": "culture",
    "Nazar amulet": "religious", "Performing arts": "abstract", "Pine decoration": "culture",
    "Pool 8 ball": "adult", "Red envelope": "culture", "Reminder ribbon": "abstract",
    "Slot machine": "adult", "Softball": "duplicate", "Sparkles": "symbol",
    "Tanabata tree": "culture", "Wind chime": "culture",
    # ---------------- Animals & Nature
    "Cat face": "duplicate", "Cow face": "duplicate", "Dog face": "duplicate",
    "Dragon face": "duplicate", "Horse face": "duplicate", "Monkey face": "duplicate",
    "Mouse face": "duplicate", "Pig face": "duplicate", "Rabbit face": "duplicate",
    "Tiger face": "duplicate", "Front-facing baby chick": "duplicate",
    "Hatching chick": "duplicate", "Guide dog": "duplicate", "Service dog": "duplicate",
    "Poodle": "duplicate", "Two-hump camel": "duplicate",
    "Rat": "duplicate", "Ox": "duplicate", "Ram": "duplicate",
    "Spouting whale": "duplicate", "Empty nest": "duplicate", "Shamrock": "duplicate",
    "Leaf fluttering in wind": "duplicate", "Water buffalo": "unfamiliar", "Dodo": "unfamiliar",
    "Microbe": "abstract", "Paw prints": "abstract", "Pig nose": "abstract", "Wing": "abstract",
    "Rosette": "symbol", "White flower": "symbol", "Phoenix bird": "culture",
    "Sheaf of rice": "culture",
    # ---------------- Food & Drink
    "Amphora": "unfamiliar", "Beer mug": "adult", "Clinking beer mugs": "adult",
    "Clinking glasses": "adult", "Cocktail glass": "adult", "Wine glass": "adult",
    "Sake": "adult", "Bottle with popping cork": "adult", "Tumbler glass": "adult",
    "Tropical drink": "adult", "Bento box": "culture", "Oden": "culture", "Dango": "culture",
    "Fish cake with swirl": "culture", "Moon cake": "culture", "Rice cracker": "culture",
    "Mate": "culture", "Tamale": "culture", "Falafel": "culture", "Stuffed flatbread": "culture",
    "Fondue": "culture", "Fortune cookie": "culture", "Curry rice": "culture",
    "Rice ball": "culture", "Bubble tea": "culture", "Shaved ice": "culture",
    "Roasted sweet potato": "culture", "Fried shrimp": "culture", "Takeout box": "culture",
    "Shallow pan of food": "culture", "Ginger root": "unfamiliar",
    "Teacup without handle": "duplicate", "Fork and knife with plate": "duplicate",
    "Pouring liquid": "abstract",
    # ---------------- Objects
    "Alembic": "unfamiliar", "Balance scale": "abstract", "Ballot box with ballot": "adult",
    "Bar chart": "adult", "Bell with slash": "symbol", "Black nib": "adult",
    "Notebook": "duplicate", "Notebook with decorative cover": "duplicate", "Ledger": "adult",
    "Bookmark": "adult", "Bookmark tabs": "adult", "Broken chain": "abstract",
    "Calendar": "adult", "Spiral calendar": "adult", "Tear-off calendar": "adult",
    "Camera with flash": "duplicate", "Card file box": "adult", "Card index": "adult",
    "Card index dividers": "adult", "Chains": "abstract", "Chart decreasing": "adult",
    "Chart increasing": "adult", "Chart increasing with yen": "adult", "Cigarette": "adult",
    "Clamp": "unfamiliar", "Clapper board": "unfamiliar", "Clipboard": "adult",
    "Closed mailbox with lowered flag": "duplicate", "Closed mailbox with raised flag": "duplicate",
    "Open mailbox with lowered flag": "duplicate", "Open mailbox with raised flag": "duplicate",
    "Clutch bag": "duplicate", "Purse": "duplicate", "Coffin": "scary",
    "Computer disk": "unfamiliar", "Dvd": "unfamiliar", "Optical disk": "unfamiliar",
    "Floppy disk": "unfamiliar", "Videocassette": "unfamiliar", "Control knobs": "abstract",
    "Credit card": "adult", "Crossed swords": "scary", "Dagger": "scary", "Diya lamp": "culture",
    "Dna": "abstract", "Dollar banknote": "adult", "Euro banknote": "adult",
    "Pound banknote": "adult", "Yen banknote": "adult", "Money bag": "adult",
    "Money with wings": "adult", "Drop of blood": "scary", "Long drum": "duplicate",
    "E-mail": "symbol", "Envelope with arrow": "symbol", "Incoming envelope": "symbol",
    "Elevator": "symbol", "Fax machine": "adult", "File cabinet": "adult", "File folder": "adult",
    "Open file folder": "adult", "Film frames": "abstract", "Film projector": "unfamiliar",
    "Fountain pen": "duplicate", "Funeral urn": "scary", "Gear": "abstract",
    "Graduation cap": "unfamiliar", "Hair pick": "unfamiliar", "Hammer and pick": "duplicate",
    "Hammer and wrench": "duplicate", "Pick": "duplicate", "Headstone": "scary",
    "Hook": "unfamiliar", "Identification card": "adult", "Inbox tray": "adult",
    "Outbox tray": "adult", "Old key": "duplicate", "Keyboard": "duplicate",
    "Kimono": "culture", "Sari": "culture", "Label": "adult", "Level slider": "abstract",
    "Link": "symbol", "Linked paperclips": "duplicate", "Locked with key": "duplicate",
    "Locked with pen": "duplicate", "Unlocked": "duplicate", "Loudspeaker": "symbol",
    "Muted speaker": "symbol", "Speaker high volume": "symbol", "Speaker low volume": "symbol",
    "Speaker medium volume": "symbol", "Low battery": "symbol",
    "Magnifying glass tilted right": "duplicate", "Memo": "adult",
    "Studio microphone": "duplicate", "Military helmet": "scary", "Moai": "culture",
    "Mobile phone with arrow": "symbol", "Video camera": "duplicate", "Musical note": "symbol",
    "Musical notes": "symbol", "Musical score": "abstract", "Rolled-up newspaper": "duplicate",
    "Page facing up": "adult", "Page with curl": "adult", "Pager": "unfamiliar",
    "Petri dish": "unfamiliar", "Test tube": "unfamiliar", "Placard": "abstract",
    "Postal horn": "unfamiliar", "Prayer beads": "religious", "Pushpin": "adult",
    "Round pushpin": "symbol", "Receipt": "adult", "Red paper lantern": "culture",
    "Safety pin": "unfamiliar", "Satellite antenna": "unfamiliar", "Scroll": "unfamiliar",
    "Spiral notepad": "adult", "Telephone receiver": "duplicate", "Trackball": "unfamiliar",
    "Triangular ruler": "duplicate", "White cane": "unfamiliar", "X-ray": "abstract",
    # ---------------- Travel & Places
    "Airplane arrival": "duplicate", "Airplane departure": "duplicate",
    "Mantelpiece clock": "duplicate", "Timer clock": "duplicate", "Hourglass not done": "duplicate",
    "Auto rickshaw": "culture", "Oncoming automobile": "duplicate", "Oncoming bus": "duplicate",
    "Oncoming police car": "duplicate", "Oncoming taxi": "duplicate", "Bank": "adult",
    "Barber pole": "unfamiliar", "Bellhop bell": "unfamiliar", "Bridge at night": "abstract",
    "High-speed train": "duplicate", "Japanese castle": "culture", "Church": "religious",
    "Hindu temple": "religious", "Kaaba": "religious", "Mosque": "religious",
    "Shinto shrine": "religious", "Synagogue": "religious", "Cityscape at dusk": "duplicate",
    "Classical building": "unfamiliar", "Closed umbrella": "duplicate",
    "Cloud with lightning and rain": "duplicate", "Construction": "symbol",
    "Convenience store": "culture", "Cyclone": "symbol", "Department store": "adult",
    "Derelict house": "scary", "Factory": "adult", "Fog": "abstract", "Foggy": "abstract",
    "First quarter moon face": "moon_phase", "Last quarter moon face": "moon_phase",
    "New moon face": "moon_phase", "Full moon face": "duplicate",
    "Globe showing asia-australia": "duplicate", "Globe showing europe-africa": "duplicate",
    "Globe with meridians": "symbol", "Glowing star": "duplicate", "High voltage": "symbol",
    "Horizontal traffic light": "duplicate", "Hot springs": "symbol", "Hotel": "adult",
    "Houses": "duplicate", "House with garden": "duplicate", "Japanese post office": "culture",
    "Post office": "adult", "Metro": "symbol",
    "Monorail": "duplicate", "Suspension railway": "duplicate",
    "Mountain cableway": "duplicate", "Tram car": "duplicate",
    "Trolleybus": "duplicate", "Minibus": "duplicate", "Love hotel": "adult",
    "Motorized wheelchair": "duplicate", "Map of japan": "culture", "Milky way": "abstract",
    "Speedboat": "duplicate", "Motorway": "abstract", "Mount fuji": "culture",
    "Snow-capped mountain": "duplicate", "National park": "abstract", "Office building": "adult",
    "Oil drum": "unfamiliar", "Passenger ship": "duplicate", "Police car light": "duplicate",
    "Railway track": "abstract", "Seat": "unfamiliar", "Snowman without snow": "duplicate",
    "Stadium": "unfamiliar", "Station": "unfamiliar", "Statue of liberty": "culture",
    "Stop sign": "symbol", "Sun with face": "duplicate", "Sun behind small cloud": "duplicate",
    "Sun behind large cloud": "duplicate", "Sun behind rain cloud": "duplicate",
    "Sunrise": "abstract", "Sunrise over mountains": "abstract", "Sunset": "abstract",
    "Tokyo tower": "culture", "Umbrella with rain drops": "duplicate",
    "Umbrella on ground": "duplicate", "Wedding": "abstract", "Wind face": "abstract",
    "World map": "abstract",
}

CLOCK_SUFFIXES = (" oclock", "-thirty")
MOON_PHASES = {
    "First quarter moon", "Last quarter moon", "New moon", "Waning crescent moon",
    "Waning gibbous moon", "Waxing crescent moon", "Waxing gibbous moon",
}


def drop_reason(name: str, group: str) -> str | None:
    """Return why a folder is not a card, or None if it is kept."""
    if group in DROP_GROUPS:
        return DROP_GROUPS[group]
    if group in KEEP_ONLY:
        if name in KEEP_ONLY[group]:
            return None
        if group == "Smileys & Emotion":
            return "face"
        if name.startswith(("Man ", "Woman ")):
            return "gender_dup"
        hand_words = ("hand", "finger", "fist", "thumb", "index", "palm", "salute", "gesture", "horns")
        if any(w in name.lower() for w in hand_words):
            return "gesture"
        return "person"
    if name.endswith(CLOCK_SUFFIXES):
        return "clock_time"
    if name in MOON_PHASES:
        return "moon_phase"
    return DROP.get(name)
