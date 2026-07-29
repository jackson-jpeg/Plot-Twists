/**
 * Catalog generator — the authored source of `lib/content.ts`.
 *
 *   [VPS] npx tsx scripts/build-catalog.ts     # rewrites lib/content.ts in place
 *
 * WHY THIS FILE EXISTS. Chunk 4 layer 1 was done once by hand, entry by entry, and produced
 * PARAPHRASE: every character kept its 1:1 mapping to a protected original and the catalog kept
 * its franchise-by-franchise ordering, because editing in place preserves order by construction.
 * Both of those are structural properties, and structural properties should be produced by code
 * rather than promised in a commit message. The shuffle below is why `lib/content.ts` cannot be
 * franchise-grouped: there is no hand-maintained order left to group.
 *
 * THE CARD GRAMMAR (this is the actual change, not a wording pass):
 *
 *   CHARACTER  is a TRAIT or FLAW, never a person. No job title, no species, no era, no
 *              silhouette. "A grumpy swamp ogre who wants to be left alone" is a person with the
 *              name filed off; "Insists nothing is wrong at increasing volume" is a way of being
 *              that any player can put on. The former maps to exactly one character; the latter
 *              maps to your uncle.
 *
 *   SETTING    and SITUATION carry the specificity budget instead. They are not IP-constrained
 *              and were carrying almost none of the comedy — the old situations were "Stuck in an
 *              elevator with strangers", which is a category, not a joke.
 *
 *   GENRE AND PUBLIC DOMAIN are used deliberately and are not property: noir, Cold War spy,
 *              Western, Shakespeare, Greek myth, Grimm, Arthurian, Gothic, Dickens, Austen,
 *              Brontë. These appear as SETTINGS, never as characters — see the note on the
 *              done-criterion below, because the two rules pull against each other.
 *
 * ON THE DONE-CRITERION AND PUBLIC DOMAIN. The rule is "no entry may map 1:1 to an identifiable
 * character". Public-domain CHARACTERS (Holmes, Dracula, Ahab) would satisfy the law and fail the
 * rule — you can name them. So the character deck contains none, and public domain enters through
 * setting and situation, where what is evoked is a SCENE rather than a person: a fog-bound sitting
 * room with two armchairs, a castle at the top of a long staircase in the Carpathians. That is an
 * interpretation of two rules that conflict, not a rule I was given, and it is flagged as such in
 * the write-up.
 *
 * TAGS are derived, not authored — significant words from the name, lowercased. They exist only to
 * power search in the browse modal. Hand-authored tags on 516 entries would rot within a session.
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

type Authored = { name: string; category: string; maturity: 'safe' | 'mature' }

const c = (category: string, maturity: 'safe' | 'mature', names: string[]): Authored[] =>
  names.map(name => ({ name, category, maturity }))

// ════════════════════════════════════════════════════════════════════════════
// CHARACTERS — traits and flaws. A player performs SOMEONE WHO does this.
// ════════════════════════════════════════════════════════════════════════════

const CHARACTERS_AUTHORED: Authored[] = [
  ...c('sitcom', 'safe', [
    'Apologises for things that have not happened yet',
    'Explains the joke immediately after telling it',
    'Cannot leave a room in under twenty minutes',
    'Repeats the last three words you said, thoughtfully',
    'Answers rhetorical questions',
    'Laughs one full beat after everybody else',
    'Gets everyone’s name almost right',
    'Compliments people in a way that ruins their afternoon',
    'Will not admit to not having read it',
    'Treats every conversation as a negotiation',
    'Has never once allowed a silence to happen',
    'Asks how much everything cost',
    'Assumes they were invited',
    'Re-gifts things in front of the person who gave them',
    'Says "no offence" and then takes some',
    'Volunteers other people for things',
    'Keeps score of favours going back eleven years',
    'Introduces themselves twice to the same person',
    'Refuses to acknowledge that they are lost',
    'Answers a different question to the one asked',
    'Corrects pronunciation, always wrongly',
    'Has an anecdote for this and it runs nine minutes',
    'Cannot receive a compliment without dismantling it',
    'Says "long story" and then tells it',
    'Has one strong opinion and applies it to everything',
    'Speaks to animals as equals and to people as staff',
    'Refuses to sit down',
    'Is aggressively relaxed',
    'Wants to know who is in charge',
    'Has already decided this is a scam',
    'Treats every stranger as a long-lost friend',
    'Explains your own job to you',
    'Is loudly whispering',
    'Has an urgent errand elsewhere and will not leave',
    'Cannot stop improving the arrangement of the furniture',
    'Has strong views about the correct way to queue',
    'Believes they are the calm one',
    'Would like to make one small point, at length',
    'Keeps a list and you are on it',
    'Cannot tell when a conversation has ended',
    'Is quietly furious about something from last week',
    'Insists nothing is wrong at increasing volume',
    'Is doing a bit and will not stop',
    'Answers on behalf of everyone',
    'Cannot be trusted near an unattended microphone',
    'Is here for the free food and has said so',
    'Interprets all silence as agreement',
    'Was told a secret this morning and is visibly holding it',
    'Insists on paying and cannot',
    'Reads every sign aloud',
    'Has an allergy that changes depending on the menu',
    'Cannot pass a mirror',
    'Has already told this story to two of you',
    'Gives directions to places they have never been',
    'Is unable to whisper',
    'Considers themselves a good judge of character and is not',
    'Was clearly crying before they came in',
    'Times things nobody asked to be timed',
    'Believes they were promised something',
    'Keeps offering to help in ways that make it worse',
    'Has never lost an argument because they never concede one',
    'Is doing an impression of somebody in the room',
    'Is aggressively fine',
    'Would like to revisit a decision made in 2011',
    'Treats every rule as a first offer',
    'Explains why they are late for longer than they were late',
    'Cannot stop confessing to minor things',
    'Is convinced everyone else was briefed',
    'Has been awake for an unreasonable number of hours',
    'Has one anecdote and it does not fit here',
    'Speaks entirely in questions when nervous',
    'Is trying very hard to seem taller',
    'Has fierce loyalty to a brand nobody mentioned',
    'Refuses to say what they do for a living',
    'Wants everyone to guess their age',
    'Assumes they are the funniest person here',
    'Corrects the record about things nobody disputed',
    'Has decided today is the day they say something',
    'Cannot let anyone else finish a sentence',
    'Insists on introducing everybody to everybody',
    'Has recently learned one fact and cannot stop deploying it',
    'Reacts to bad news with immediate logistics',
    'Suggests a group photograph at every escalation',
    'Would rather die than ask for clarification',
    'Has been given one job and forgotten what it is',
    'Keeps checking a phone that is receiving nothing',
    'Insists they called ahead',
    'Is chewing something nobody saw them acquire',
    'Has an opinion on the acoustics',
    'Was clearly the best at this thirty years ago',
    'Says "as I was saying" having said nothing',
    'Finishes other people’s anecdotes wrongly',
    'Tries to shake hands with people mid-argument',
    'Assumes the worst and is often right',
    'Has already forgiven you for something',
    'Insists on a vote',
    'Cannot start until everyone is sitting properly',
    'Has a rule about this and will explain the rule',
    'Was raised by people with very specific views on cutlery',
    'Believes flattery is invisible',
    'Refuses all offers three times as a matter of form',
    'Reacts to compliments as though accused',
    'Has a theory about the building',
    'Considers themselves the audience',
    'Has been trying to leave since before this started',
    'Is on a diet and will be discussing it',
    'Believes in one conspiracy, deeply, and it is boring',
    'Practises their signature during conversations',
  ]),

  ...c('workplace', 'safe', [
    'Has a slide deck for this',
    'Was promoted last week and has not recovered',
    'Considers themselves the only adult present',
    'Escalates everything to a manager who does not exist',
    'Turns every decision into a workshop',
    'Sends the follow-up email during the meeting',
    'Uses the word "learnings"',
    'Has read one book about leadership',
    'Describes their own job in a way nobody understands',
    'Books meetings to prepare for meetings',
    'Insists on going round the room',
    'Was hired for a role that no longer exists and has not been told',
    'Takes the minutes and edits them',
    'Says the quiet part with the door open',
    'Will not approve anything without a second opinion they never seek',
  ]),

  ...c('romance', 'safe', [
    'Falls in love once per scene',
    'Has been rehearsing this conversation for a year',
    'Confesses feelings at structurally catastrophic moments',
    'Believes every look is meaningful',
    'Is being extremely normal about it',
    'Has already named the children',
    'Mistakes politeness for devotion',
    'Breaks up with people who have not agreed to date them',
  ]),

  ...c('classic', 'safe', [
    'Speaks in verse and cannot be talked out of it',
    'Treats every exit as a curtain call',
    'Narrates their own actions in the third person',
    'Delivers devastating news like a weather forecast',
    'Addresses the room as though it were a much larger room',
    'Has an aside for everything',
    'Performs grief beautifully and feels none of it',
    'Will not use one word where nine are available',
    'Speaks only in proverbs, none of them real',
    'Refuses to break character in a crisis',
  ]),

  ...c('mystery', 'safe', [
    'Knows something and is waiting to be asked',
    'Notices the wrong detail with total confidence',
    'Solves it in the first minute and is ignored',
    'Has an alibi ready for a crime nobody has mentioned',
    'Suspects everybody, correctly, for the wrong reasons',
    'Answers questions with better questions',
    'Takes notes on everything you say',
    'Has already searched your bag',
  ]),

  ...c('action', 'safe', [
    'Is calm in a way that should worry you',
    'Announces the plan while it is failing',
    'Has been waiting years for exactly this',
    'Cannot walk away from a dare',
    'Treats minor inconvenience as a siege',
    'Is significantly less prepared than stated',
    'Counts down out loud, incorrectly',
    'Has one move and it works',
  ]),

  ...c('fantasy', 'safe', [
    'Has recently been told a prophecy and is coping badly',
    'Speaks politely to something nobody else can see',
    'Believes they are cursed and may be right',
    'Offers bargains nobody asked for',
    'Cannot lie and desperately wishes to',
    'Owes a debt to something that has not yet collected',
    'Insists on the proper form of address',
    'Has one wish left and is being very careful',
  ]),

  ...c('scifi', 'safe', [
    'Is running slightly behind everyone else in time',
    'Explains the technology at length and gets it wrong',
    'Has done this before, several times',
    'Is certain the room is a simulation and keeps testing it',
    'Predicts outcomes with total confidence and no accuracy',
    'Keeps referring to events that have not happened',
    'Believes they are dreaming and behaves accordingly',
  ]),

  ...c('horror', 'safe', [
    'Is delighted by things that should delight nobody',
    'Smiles at the wrong moments',
    'Knows exactly how everyone in the room dies',
    'Has been in this house before',
    'Does not blink',
    'Is sorry about what is going to happen',
    'Believes the room is being recorded',
  ]),

  ...c('animation', 'safe', [
    'Reacts to everything at maximum volume',
    'Is physically incapable of standing still',
    'Believes the laws of physics are negotiable',
    'Falls over at the mention of anything',
    'Has a plan involving a very large mallet',
    'Is thrilled and has no idea why',
    'Will not stop touching things labelled do not touch',
  ]),

  ...c('adventure', 'safe', [
    'Is confident about a direction they have invented',
    'Has packed for a completely different trip',
    'Refuses to read the map on principle',
    'Is only here because somebody bet them',
    'Has an emergency plan for this specific building',
    'Assumes any locked door is for them',
    'Is currently pretending to be somebody else and is bad at it',
    'Believes they are undercover',
    'Is here under a slightly false name',
  ]),

  // ── mature ────────────────────────────────────────────────────────────────
  ...c('crime', 'mature', [
    'Threatens people by offering to help',
    'Has never once raised their voice and that is the problem',
    'Is unfailingly polite while ruining you',
    'Knows what you did and would like to discuss terms',
    'Has buried something and is being odd about the garden',
    'Is owed money by three people in this room',
    'Treats loyalty as a receipt',
    'Has a lawyer on the phone already',
    'Was the last person to see them alive and mentions it constantly',
    'Is on their fourth identity and losing track',
    'Bribes with a warmth that is genuinely unsettling',
    'Has done something unforgivable and would do it again',
    'Is here to collect',
    'Has an alibi that only works if nobody checks the time',
    'Keeps everyone’s secrets and mentions this often',
    'Considers betrayal a form of feedback',
    'Owes a favour to somebody nobody wants to name',
    'Is wearing somebody else’s coat',
    'Has been skimming for years and is nearly caught',
    'Has one gun and no plan',
    'Would like everyone to know it was self-defence',
    'Is negotiating for their own life and enjoying it',
    'Keeps confessing to crimes they did not commit',
    'Has taken something that was not offered',
    'Is recording this',
    'Has the photographs',
    'Was paid to be here and has said so',
    'Would sell any person in this room for a moderate sum',
    'Has been to prison and will not say what for',
    'Has forged something and is proud of the craft',
    'Blackmails people gently, almost kindly',
    'Has one line they will not cross and has moved it twice',
    'Was somebody’s alibi and is reconsidering',
    'Has already chosen who to blame',
    'Is here to make sure nobody talks',
    'Was told to keep it clean and has not',
    'Is quietly certain they will outlive everyone here',
    'Has been lying about their qualifications for eleven years',
    'Will do it if nobody else will, and would prefer to',
  ]),

  ...c('sitcom', 'mature', [
    'Is high and hosting',
    'Has been sober for six hours',
    'Cannot stop talking about their divorce',
    'Is legally not allowed within a certain distance of somebody here',
    'Was fired for something they still consider correct',
    'Drinks in a way that has become a schedule',
    'Enjoys the part where they cry',
    'Is the reason for the smell',
    'Considers this an audition',
    'Treats therapy as reconnaissance',
    'Has a body count and a spreadsheet',
  ]),

  ...c('horror', 'mature', [
    'Explains violence like a hobby',
    'Treats grief as an opportunity',
    'Considers cruelty a form of honesty',
    'Has poisoned somebody once, mildly, as a lesson',
    'Is being followed and is fine with it',
    'Sleeps with the wrong people strategically',
  ]),
]

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS — where the specificity budget went. Weird, particular, ownerless.
// ════════════════════════════════════════════════════════════════════════════

const SETTINGS_AUTHORED: Authored[] = [
  ...c('sitcom', 'safe', [
    'A Municipal Swimming Pool Drained Three Years Ago For Repairs',
    'An All-Night Laundrette With One Working Machine And A Queue',
    'A Motorway Services At Four In The Morning During A Power Cut',
    'The Back Office Of A Shop That Only Sells Left Shoes',
    'A Ferry That Has Been Boarding For Six Hours',
    'A Village Fête In Torrential Rain That Nobody Will Acknowledge',
    'A Lift Stuck Between Floors In A Building With No Thirteenth Floor',
    'The Green Room Of A Show Cancelled Mid-Broadcast',
    'A Garden Centre Café At Closing Time',
    'A Hotel Conference Suite Set For Ninety And Attended By Four',
    'A Corridor Of Identical Doors And One Wrong One',
    'The Waiting Room Of A Practice Nobody Can Name',
    'A Church Hall Booked By Two Groups At Once',
    'A Petrol Station With No Petrol And Excellent Sandwiches',
    'A Wedding Marquee In A Field That Was Sold Last Week',
    'A Bowling Alley With One Broken Lane And A Birthday Party',
    'A Charity Shop Where Everything Is Somehow The Wrong Size',
    'A Night Bus Going The Long Way Round',
    'A Sauna Occupied By Strangers Who Will Not Leave First',
    'A Recording Studio Booked By The Hour, Fifty Minutes Gone',
    'A Dentist’s Waiting Room With One Magazine From 1998',
    'A Cinema Screening Something Nobody Chose',
    'A Community Centre Mid-Refurbishment',
    'A Function Room Above A Pub, Booked Under The Wrong Name',
    'A Barber’s With Three Chairs And One Barber',
    'A Departure Lounge For A Flight That Keeps Changing Gate',
    'A Rehearsal Room With The Wrong Instruments In It',
    'A Corner Shop At Two Minutes Past Closing',
    'A Photo Booth With Four People In It',
    'A Bus Shelter In A Storm',
    'A Village Hall Quiz At The Tie-Break',
    'A Wine Tasting That Has Gone On Too Long',
    'A Long Corridor In A Hospital At Visiting Hour',
    'A Kitchen During The Twenty Minutes Before Guests Arrive',
    'A Car On A Long Drive With Ninety Minutes Left',
    'A Provincial Radio Station At Three In The Morning',
  ]),

  ...c('adventure', 'safe', [
    'A Cable Car Halfway Across And Not Moving',
    'A Coach Trip That Has Stopped And Nobody Knows Why',
    'The Roof Of A Building Whose Door Has Locked Behind You',
    'An Escape Room The Staff Have Gone Home From',
    'A Tram At A Standstill Between Two Stops',
    'A Ski Lift Stopped With A View',
    'A Boat Hire Kiosk On A Lake With No Boats',
    'A Beach Out Of Season In A Sudden Downpour',
    'A Nature Reserve Hide With Nothing To See',
    'An Allotment With A Long-Running Territorial Dispute',
    'A Multi-Storey Car Park Where The Barrier Has Failed',
    'A Portacabin On A Building Site At Lunch',
    'An Island With One Goat, One Rifle And Four Survivors',
    'A Submarine At Silent Running',
    'A Duel At Dawn, Both Parties Regretting It',
  ]),

  ...c('mystery', 'safe', [
    'A Detective’s Sitting Room, Fog At The Window, Two Armchairs',
    'A Rain-Slick Office Above A Sign That Flickers',
    'A Checkpoint In A Divided City, Both Sides Watching',
    'A Park Bench Chosen For Its Sightlines',
    'A Museum Wing Closed To The Public And Occupied Anyway',
    'A Stairwell Between Two Locked Fire Doors',
    'An Attic Nobody Has Entered Since The Funeral',
    'A Cellar With A Light On A Timer',
    'A Speakeasy Behind A Door Requiring A Word Nobody Remembers',
    'A Sheriff’s Office With One Cell And Two Prisoners',
    'A Saloon Where The Piano Has Just Stopped',
  ]),

  ...c('classic', 'safe', [
    'A Blasted Heath With A Cauldron And Bad Weather',
    'A Court Where A King Has Just Divided His Kingdom Badly',
    'A Balcony, A Garden Below, And Somebody Being Overheard',
    'A Debtors’ Prison At Christmas',
    'A Counting House On A Very Cold Christmas Eve',
    'A Moor At Night With A Light In A Distant Window',
    'A Drawing Room Where Five Daughters Must Be Married Off',
    'A Municipal Library After The Last Announcement',
    'An Opera House Box That Is Always Kept Empty',
    'A Whaling Ship Captained By Somebody With One Fixation',
    'A Tea Table Where Everybody Must Move Seats On The Hour',
  ]),

  ...c('fantasy', 'safe', [
    'A Ferryman’s Boat On A Very Wide, Very Slow River',
    'A Labyrinth With One Thread And No Map',
    'A Mountain Where Somebody Is Chained And Extremely Bored',
    'A Cottage Made Entirely Of Confectionery, Deep In A Wood',
    'A Tower With No Door And One Window',
    'A Ball That Ends At Midnight, Sharp',
    'A Round Table With One Empty Seat',
    'A Lake With A Hand Coming Out Of It, Holding Something',
  ]),

  ...c('horror', 'safe', [
    'A Castle At The Top Of A Very Long Staircase In The Carpathians',
    'A Ship’s Log Being Written By Somebody Running Out Of Crew',
    'A Laboratory In A Thunderstorm With A Sheet Over Something',
    'A Séance In A House With Very Good Acoustics',
    'A Greenhouse In Full Sun With The Door Jammed',
    'A Zoo Enclosure Between Occupants',
  ]),

  ...c('workplace', 'safe', [
    'A Car Park Where Somebody Has Parked Extremely Badly',
    'A Loft Conversion Two Years Into A Three-Week Job',
    'An Aquarium Gift Shop During A Fire Drill',
    'An Ice Rink Being Resurfaced Very Slowly',
    'A Fitting Room With A Curtain That Does Not Close',
  ]),

  // ── mature ────────────────────────────────────────────────────────────────
  ...c('crime', 'mature', [
    'A Lock-Up Rented In Cash Under A Name Nobody Checked',
    'A Back Room Where The Chairs Face One Way',
    'A Casino Floor At The Hour The Cameras Reboot',
    'A Nightclub Office With The Music Coming Through The Wall',
    'A Car Being Driven Somewhere Nobody Named',
    'A Farmhouse Kitchen With Too Many Phones On The Table',
    'A Motel Room Paid For A Week In Advance',
    'A Basement With Recently Laid Concrete',
    'A Country Lane With A Car Abandoned Well',
    'A Warehouse With Excellent Drainage',
    'A Marina Where One Boat Has Its Engine Running',
    'A Waiting Room Between Two Interview Rooms',
    'A Suburban Garage With A Second Freezer',
    'A Border Crossing At A Bad Hour',
    'A Strip-Lit Corridor Where The Cameras Point Away',
    'A Betting Shop Ten Minutes Before The Off',
    'A Cellar Bar That Does Not Advertise',
    'An Operating Theatre Booked Off The Record',
    'A Cul-De-Sac Where Everybody Is Watching Through Nets',
    'A Prison Visiting Hall On A Wet Tuesday',
    'A Field At Dawn With Two Spades',
    'A Rented Flat With The Deposit Already Written Off',
    'A Panel Room Where The Recording Light Is Off',
  ]),

  ...c('crime', 'mature', [
    'A Funeral Wake Where Nobody Will Sit With The Widow',
    'A Hospital Corridor At The Hour Nobody Visits',
    'A Boardroom Where Everybody Has Already Voted',
    'A Kitchen Where One Chair Has Been Moved',
    'A Chapel Booked At Very Short Notice',
    'A Wedding Reception Where Two Families Are Counting',
    'A Late-Night Kebab Shop With Nowhere Else To Go',
    'A Church Confessional With A Queue Of One',
    'A Hotel Bar Where Everybody Is Waiting For Somebody Else',
    'A Bathroom Where Somebody Has Been A Very Long Time',
    'A Newsroom Sitting On Something',
  ]),
]

// ════════════════════════════════════════════════════════════════════════════
// CIRCUMSTANCES — the other half of the specificity budget. A predicament, not
// a category. The old deck said "Stuck in an elevator with strangers", which
// is a genre of situation rather than a situation.
// ════════════════════════════════════════════════════════════════════════════

const CIRCUMSTANCES_AUTHORED: Authored[] = [
  ...c('sitcom', 'safe', [
    'The fire alarm has gone off and nobody will be the first to leave',
    'Somebody has brought a cake and will not say what the occasion is',
    'A stranger has arrived claiming to be expected',
    'Everybody has been given a different set of instructions',
    'You are all pretending to have read the same book',
    'A eulogy is required in nine minutes for somebody nobody liked',
    'The photograph on the wall has changed and only one of you has noticed',
    'One of you has been replaced and the replacement is doing better',
    'There is one chair too few and nobody will mention it',
    'The wrong order has arrived and it is much better',
    'Somebody has to tell them, and it is being decided by silence',
    'A speech must be given in a language nobody present speaks',
    'The lights go out for exactly eleven seconds at a time',
    'Everyone has been told this is a surprise for somebody else',
    'A very small task has been escalated to a committee',
    'You are being timed and nobody has said what for',
    'There is a queue and nobody knows what it is for',
    'Somebody has lost something and will not say what',
    'The instructions have been translated twice and back',
    'Everyone is waiting for one person who is already here',
    'A gift must be opened in front of the person who gave it',
    'Two people are having the same conversation about different things',
    'A group photograph is being taken and nobody will move',
    'There is one umbrella',
    'Somebody’s name was read out wrongly and nobody corrected it',
    'A decision must be unanimous and one person has left',
    'Everybody has agreed not to mention the smell',
    'You have twenty minutes to explain a decision you did not make',
    'A rehearsal is happening and one person thinks it is real',
    'There is a rule and nobody can remember why',
    'Somebody has invited somebody who was not to be invited',
    'The last person to speak becomes responsible',
    'An award must be given and there are no candidates',
    'Everyone must say one true thing before leaving',
    'A pet has been brought and it is not the right pet',
    'There is a form and it must be completed together',
    'Somebody is leaving and has not told them yet',
    'Everybody has to agree on one song',
    'There is a smell of burning and a discussion about whose turn it is',
    'Somebody has been talking for eleven minutes without a verb',
    'A minor error is being investigated at extraordinary length',
    'Everybody must leave in reverse order of arrival',
    'The room is deciding whether to allow what was just said',
    'There is a second cake',
    'A toast must be made to somebody nobody has met',
    'Everybody is pretending they knew about this',
    'Somebody has read the wrong email out loud',
    'There is a fly and it has become the main issue',
    'One of you is being tested and the others were told',
    'A tradition is being observed and nobody knows the words',
    'Somebody must be told they are not invited to the next part',
    'A door has been locked from the outside, politely',
    'Everybody must pick a side and neither has been described',
    'A phone is ringing and it belongs to none of you',
    'A game has begun and only some of you were told',
    'Somebody has brought their own chair',
    'There is a competition and the prize has not been mentioned',
    'Everyone must remain until somebody admits something',
    'A very long silence has become a policy',
    'Somebody has given a speech clearly written for a different event',
    'There is a queue system and one of you invented it',
    'A costume is required and there is one',
    'Somebody has to eat it to be polite',
    'The heating cannot be turned off and nobody will say anything',
    'A vote has been taken and lost by one',
    'Somebody has confessed to something extremely minor, at length',
    'Everybody is being polite about the wallpaper',
    'There is a plan and it depends entirely on the weather',
    'A relative has arrived a day early',
    'A very old grudge has been raised at the worst possible moment',
    'Everyone is waiting for a delivery that will not come',
    'Somebody has been mistaken for somebody important and is going along with it',
    'The seating plan has been ignored',
    'A performance has been requested and refusal is not possible',
    'Somebody keeps checking whether everybody is having a nice time',
    'There is one working plug',
    'A group decision must be made about a person who is present',
    'Everyone has to write on the same card',
    'Somebody has locked their keys inside the thing everybody needs',
    'A rota has been drawn up and immediately violated',
    'The wrong music is playing and it is very loud',
    'Somebody has brought slides',
    'A minute’s silence has run to four',
    'There is a leak and everybody is negotiating whose problem it is',
    'A dispute about a bill has escalated beyond the bill',
    'Somebody has been sitting there the whole time',
    'A goodbye is taking longer than the visit',
    'Everybody has to guess what has changed',
    'A single biscuit remains',
    'Somebody has to go back in and get it',
    'Everyone must leave through one door, one at a time, for reasons',
  ]),

  // ── mature ────────────────────────────────────────────────────────────────
  ...c('crime', 'mature', [
    'A body has been discovered by the least suitable person',
    'The wrong body has been delivered',
    'Somebody has to be told that they are the reason',
    'A confession has been made to the wrong person',
    'Everybody agreed a story and one of you is off-script',
    'Money is missing and everyone in the room is a suspect',
    'A debt has come due and the room is being valued',
    'Somebody has to volunteer and nobody has',
    'A witness is being persuaded',
    'A phone is being looked for and everybody knows why',
    'Somebody has been let out early and nobody was told',
    'An affair is about to be discussed in the third person',
    'The police are outside and have not knocked yet',
    'A funeral is being planned by people who disagree about the cause',
    'Somebody has been recording the entire time',
    'A deal must be closed before somebody sobers up',
    'There is one seat in the car and four people',
    'Somebody must be identified and nobody wants to look',
    'A threat has been made in front of a child',
    'A will is being read and it is worse than expected',
    'Everyone was given the same alibi and one detail differs',
    'A hostage has begun making suggestions',
    'Somebody’s medication ran out this morning',
    'What was supposed to be sold has been taken',
    'There is a smell of petrol and nobody has mentioned matches',
    'Somebody has been paid to be here and it has been noticed',
    'A very old body has surfaced with the tide',
    'An intervention has become a hostage situation by degrees',
    'Somebody has come back who was meant to be gone',
    'A lie is being maintained by four people at four different speeds',
    'Everybody is waiting to see who breaks first',
    'A blackmail payment has arrived in the wrong denominations',
    'A doctor has been called who should not have been',
    'Somebody has to go in the water',
    'A gun has been placed on the table by mistake',
    'A jury is being spoken to outside a courthouse',
    'Somebody has to sign it and their hand will not work',
    'An heir has arrived who nobody knew existed',
    'A grave has been dug in the wrong place',
    'Somebody has been told they have six weeks and has told nobody',
    'A room must be cleaned before a certain hour',
    'Everybody is being asked, one at a time, in the next room',
  ]),
]

// ════════════════════════════════════════════════════════════════════════════
// Deterministic shuffle. Fixed seed so the file is reproducible: re-running the
// generator on unchanged input must not produce a diff, or every catalog edit
// becomes a 500-line review.
// ════════════════════════════════════════════════════════════════════════════

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates, seeded. Same idiom as server/utils/shuffle.ts, not the biased sort-comparator. */
function shuffled<T>(items: T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'that', 'this', 'it', 'its',
  'they', 'them', 'their', 'you', 'your', 'who', 'whom', 'which', 'what', 'not', 'no', 'one',
  'from', 'as', 'so', 'if', 'up', 'out', 'about', 'into', 'over', 'than', 'then', 'there',
  'here', 'very', 'will', 'would', 'can', 'cannot', 'does', 'do', 'did', 'somebody', 'someone',
  'everybody', 'everyone', 'nobody', 'anybody', 'must', 'been',
])

function tagsFor(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 4)
}

function slug(prefix: string, name: string, taken: Set<string>): string {
  const base =
    prefix +
    '-' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w && !STOPWORDS.has(w))
      .slice(0, 5)
      .join('-')
  let id = base
  let n = 2
  while (taken.has(id)) id = `${base}-${n++}`
  taken.add(id)
  return id
}

function emit(prefix: string, items: Authored[], rng: () => number): string {
  const taken = new Set<string>()
  return shuffled(items, rng)
    .map(item => {
      const id = slug(prefix, item.name, taken)
      const name = JSON.stringify(item.name)
      const tags = JSON.stringify(tagsFor(item.name))
      return `  { id: '${id}', name: ${name}, category: '${item.category}', tags: ${tags}, maturity: '${item.maturity}' },`
    })
    .join('\n')
}

const rng = mulberry32(0x504c4f54) // "PLOT"

const HEADER = `import { ContentItem } from './content-types'

// ============================================================================
// GENERATED FILE — DO NOT HAND-EDIT.
//
// Authored source: scripts/build-catalog.ts. Regenerate with:
//   [VPS] npx tsx scripts/build-catalog.ts
//
// THE CARD GRAMMAR. The character slot is a TRAIT or FLAW, never a person: no job title, no
// species, no era, no silhouette. That is the whole point of this deck and it is the thing that
// was got wrong the first time. A description engineered to evoke one specific character without
// naming it is not an archetype — it is the character with the name filed off, and it is a worse
// artefact than the name was, because it is evidence of having tried.
//
// The specificity budget lives in SETTINGS and SITUATIONS instead. Those are not IP-constrained
// and were carrying almost none of the comedy. Genre and public domain are used deliberately
// there — noir, Cold War, Western, Shakespeare, Greek myth, Grimm, Arthurian, Gothic, Dickens,
// Austen, Brontë. Genre is not property.
//
// ORDER IS A SEEDED SHUFFLE, and that is load-bearing rather than cosmetic. The previous catalog
// was ordered franchise by franchise, in cast order, which meant the grouping alone identified
// entries that were individually deniable. There is no hand-maintained order here to group.
//
// NO SOURCE ATTRIBUTION ANYWHERE, INCLUDING COMMENTS. Gated by
// __tests__/unit/lib/contentSource.test.ts, which reads this file and its generator as TEXT
// because every other IP check in the repo inspects runtime values and cannot see a comment.
// ============================================================================

// ============================================================================
// CHARACTERS
// ============================================================================

export const CHARACTERS: ContentItem[] = [
`

const TAIL = `
// ============================================================================
// LEGACY CONTENT STRUCTURE (for backwards compatibility)
// ============================================================================

export const CONTENT = {
  characters: {
    safe: CHARACTERS.filter(c => c.maturity === 'safe').map(c => c.name),
    mature: CHARACTERS.filter(c => c.maturity === 'mature').map(c => c.name)
  },
  settings: {
    safe: SETTINGS.filter(s => s.maturity === 'safe').map(s => s.name),
    mature: SETTINGS.filter(s => s.maturity === 'mature').map(s => s.name)
  },
  circumstances: {
    safe: CIRCUMSTANCES.filter(c => c.maturity === 'safe').map(c => c.name),
    mature: CIRCUMSTANCES.filter(c => c.maturity === 'mature').map(c => c.name)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get filtered content as string arrays (backwards compatible)
 */
export function getFilteredContent(isMature: boolean) {
  if (isMature) {
    return {
      characters: [...CONTENT.characters.safe, ...CONTENT.characters.mature],
      settings: [...CONTENT.settings.safe, ...CONTENT.settings.mature],
      circumstances: [...CONTENT.circumstances.safe, ...CONTENT.circumstances.mature]
    }
  }
  return {
    characters: CONTENT.characters.safe,
    settings: CONTENT.settings.safe,
    circumstances: CONTENT.circumstances.safe
  }
}

/**
 * Get filtered content as rich ContentItem arrays (for browse modal)
 */
export function getFilteredContentRich(options: {
  isMature: boolean
  categories?: string[]
  searchQuery?: string
}): { characters: ContentItem[], settings: ContentItem[], circumstances: ContentItem[] } {
  const { isMature, categories, searchQuery } = options

  const filterItems = (items: ContentItem[]) => {
    let filtered = items

    // Filter by maturity
    if (!isMature) {
      filtered = filtered.filter(item => item.maturity === 'safe')
    }

    // Filter by categories
    if (categories && categories.length > 0) {
      filtered = filtered.filter(item => categories.includes(item.category))
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  return {
    characters: filterItems(CHARACTERS),
    settings: filterItems(SETTINGS),
    circumstances: filterItems(CIRCUMSTANCES)
  }
}

// Chunk 3 item 4: \`getRandomContent\` was DELETED here rather than repaired.
//
// It carried the biased \`sort(() => Math.random() - 0.5)\` idiom and had zero callers — dealing
// goes through cardCatalog.service \`dealCards\`, which returns catalog OPTIONS with ids, not the
// bare name strings this returned. Repairing it would have left a plausible-looking helper that
// hands back exactly the un-ided free text IP layer 2 exists to keep off the wire.

// ============================================================================
// GREEN ROOM TRIVIA QUESTIONS
// ============================================================================

// Green Room trivia questions, shown during AI generation to mask latency.
//
// IP layer 1, 2026-07-29: this used to hold 22 blocks of FRANCHISE TRIVIA keyed by the old
// franchise setting names, asking players to recall specifics from those franchises. Two problems,
// and the second is why it was replaced rather than simply deleted:
//
//   1. It was IP, of a slightly worse kind than the catalog — the catalog merely named things,
//      this quizzed players on them.
//   2. It was ALREADY DEAD. Lookup is by setting name, every setting name changed, so every room
//      silently fell through to \`default\`. Nobody would have noticed except by reading this.
//
// Keyed lookup is kept so a future setting-specific pool can be added without touching callers.
export const GREEN_ROOM_QUESTIONS: Record<string, string[]> = {
  "default": [
    "What's the worst film you have ever genuinely enjoyed?",
    "If you could have any superpower, what would it be?",
    "What's the best thing you've watched recently?",
    "What's your comfort food?",
    "If you could visit any imaginary place, where would you go?",
    "What's your go-to karaoke song?",
    "What's the weirdest thing you've ever eaten?",
    "If you could time travel, which decade would you visit?",
    "What's your hidden talent?",
    "What's the best plot twist you never saw coming?",
    "Who would you want beside you in an apocalypse, and why?",
    "Which fictional vehicle would you drive?",
    "What's a line you quote far too often?",
    "What's the most embarrassing thing you have cried at?",
    "If your life had a laugh track, when would it fire?",
    "What's a completely useless fact you cannot forget?"
  ]
}

/**
 * Get a random green room question based on setting
 * Falls back to default questions if setting doesn't have specific trivia
 */
export function getGreenRoomQuestion(setting: string): string {
  const questions = GREEN_ROOM_QUESTIONS[setting] || GREEN_ROOM_QUESTIONS.default
  return questions[Math.floor(Math.random() * questions.length)]
}
`

const body =
  HEADER +
  emit('char', CHARACTERS_AUTHORED, rng) +
  `\n]\n\n// ============================================================================\n// SETTINGS\n// ============================================================================\n\nexport const SETTINGS: ContentItem[] = [\n` +
  emit('set', SETTINGS_AUTHORED, rng) +
  `\n]\n\n// ============================================================================\n// CIRCUMSTANCES\n// ============================================================================\n\nexport const CIRCUMSTANCES: ContentItem[] = [\n` +
  emit('circ', CIRCUMSTANCES_AUTHORED, rng) +
  `\n]\n` +
  TAIL

writeFileSync(join(__dirname, '../lib/content.ts'), body, 'utf8')

console.log(
  `wrote lib/content.ts — ${CHARACTERS_AUTHORED.length} characters, ` +
    `${SETTINGS_AUTHORED.length} settings, ${CIRCUMSTANCES_AUTHORED.length} circumstances`
)
