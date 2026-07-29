import { ContentItem } from './content-types'

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
  { id: 'char-read-book-leadership', name: "Has read one book about leadership", category: 'workplace', tags: ["read","book","leadership"], maturity: 'safe' },
  { id: 'char-already-searched-bag', name: "Has already searched your bag", category: 'mystery', tags: ["already","searched","bag"], maturity: 'safe' },
  { id: 'char-says-quiet-part-door-open', name: "Says the quiet part with the door open", category: 'workplace', tags: ["says","quiet","part","door"], maturity: 'safe' },
  { id: 'char-volunteers-other-people-things', name: "Volunteers other people for things", category: 'sitcom', tags: ["volunteers","other","people","things"], maturity: 'safe' },
  { id: 'char-narrates-own-actions-third-person', name: "Narrates their own actions in the third person", category: 'classic', tags: ["narrates","own","actions","third"], maturity: 'safe' },
  { id: 'char-treats-minor-inconvenience-siege', name: "Treats minor inconvenience as a siege", category: 'action', tags: ["treats","minor","inconvenience","siege"], maturity: 'safe' },
  { id: 'char-admit-having-read', name: "Will not admit to not having read it", category: 'sitcom', tags: ["admit","having","read"], maturity: 'safe' },
  { id: 'char-buried-something-being-odd-garden', name: "Has buried something and is being odd about the garden", category: 'crime', tags: ["buried","something","being","odd"], maturity: 'mature' },
  { id: 'char-stop-improving-arrangement-furniture', name: "Cannot stop improving the arrangement of the furniture", category: 'sitcom', tags: ["stop","improving","arrangement","furniture"], maturity: 'safe' },
  { id: 'char-running-slightly-behind-else-time', name: "Is running slightly behind everyone else in time", category: 'scifi', tags: ["running","slightly","behind","else"], maturity: 'safe' },
  { id: 'char-make-sure-talks', name: "Is here to make sure nobody talks", category: 'crime', tags: ["make","sure","talks"], maturity: 'mature' },
  { id: 'char-believes-room-being-recorded', name: "Believes the room is being recorded", category: 'horror', tags: ["believes","room","being","recorded"], maturity: 'safe' },
  { id: 'char-answers-different-question-asked', name: "Answers a different question to the one asked", category: 'sitcom', tags: ["answers","different","question","asked"], maturity: 'safe' },
  { id: 'char-says-offence-takes-some', name: "Says \"no offence\" and then takes some", category: 'sitcom', tags: ["says","offence","takes","some"], maturity: 'safe' },
  { id: 'char-believes-cursed-may-right', name: "Believes they are cursed and may be right", category: 'fantasy', tags: ["believes","cursed","may","right"], maturity: 'safe' },
  { id: 'char-physically-incapable-standing-still', name: "Is physically incapable of standing still", category: 'animation', tags: ["physically","incapable","standing","still"], maturity: 'safe' },
  { id: 'char-takes-minutes-edits', name: "Takes the minutes and edits them", category: 'workplace', tags: ["takes","minutes","edits"], maturity: 'safe' },
  { id: 'char-legally-allowed-within-certain-distance', name: "Is legally not allowed within a certain distance of somebody here", category: 'sitcom', tags: ["legally","allowed","within","certain"], maturity: 'mature' },
  { id: 'char-trying-leave-since-before-started', name: "Has been trying to leave since before this started", category: 'sitcom', tags: ["trying","leave","since","before"], maturity: 'safe' },
  { id: 'char-sorry-going-happen', name: "Is sorry about what is going to happen", category: 'horror', tags: ["sorry","going","happen"], maturity: 'safe' },
  { id: 'char-knows-like-discuss-terms', name: "Knows what you did and would like to discuss terms", category: 'crime', tags: ["knows","like","discuss","terms"], maturity: 'mature' },
  { id: 'char-treats-every-conversation-negotiation', name: "Treats every conversation as a negotiation", category: 'sitcom', tags: ["treats","every","conversation","negotiation"], maturity: 'safe' },
  { id: 'char-only-because-bet', name: "Is only here because somebody bet them", category: 'adventure', tags: ["only","because","bet"], maturity: 'safe' },
  { id: 'char-believes-calm', name: "Believes they are the calm one", category: 'sitcom', tags: ["believes","calm"], maturity: 'safe' },
  { id: 'char-calm-way-should-worry', name: "Is calm in a way that should worry you", category: 'action', tags: ["calm","way","should","worry"], maturity: 'safe' },
  { id: 'char-waiting-years-exactly', name: "Has been waiting years for exactly this", category: 'action', tags: ["waiting","years","exactly"], maturity: 'safe' },
  { id: 'char-drinks-way-become-schedule', name: "Drinks in a way that has become a schedule", category: 'sitcom', tags: ["drinks","way","become","schedule"], maturity: 'mature' },
  { id: 'char-given-job-forgotten', name: "Has been given one job and forgotten what it is", category: 'sitcom', tags: ["given","job","forgotten"], maturity: 'safe' },
  { id: 'char-answers-behalf', name: "Answers on behalf of everyone", category: 'sitcom', tags: ["answers","behalf"], maturity: 'safe' },
  { id: 'char-decided-today-day-say-something', name: "Has decided today is the day they say something", category: 'sitcom', tags: ["decided","today","day","say"], maturity: 'safe' },
  { id: 'char-lie-desperately-wishes', name: "Cannot lie and desperately wishes to", category: 'fantasy', tags: ["lie","desperately","wishes"], maturity: 'safe' },
  { id: 'char-told-keep-clean', name: "Was told to keep it clean and has not", category: 'crime', tags: ["told","keep","clean"], maturity: 'mature' },
  { id: 'char-apologises-things-happened-yet', name: "Apologises for things that have not happened yet", category: 'sitcom', tags: ["apologises","things","happened","yet"], maturity: 'safe' },
  { id: 'char-repeats-last-three-words-said', name: "Repeats the last three words you said, thoughtfully", category: 'sitcom', tags: ["repeats","last","three","words"], maturity: 'safe' },
  { id: 'char-somebodys-alibi-reconsidering', name: "Was somebody’s alibi and is reconsidering", category: 'crime', tags: ["alibi","reconsidering"], maturity: 'mature' },
  { id: 'char-insists-proper-form-address', name: "Insists on the proper form of address", category: 'fantasy', tags: ["insists","proper","form","address"], maturity: 'safe' },
  { id: 'char-insists-vote', name: "Insists on a vote", category: 'sitcom', tags: ["insists","vote"], maturity: 'safe' },
  { id: 'char-delivers-devastating-news-like-weather', name: "Delivers devastating news like a weather forecast", category: 'classic', tags: ["delivers","devastating","news","like"], maturity: 'safe' },
  { id: 'char-wants-know-charge', name: "Wants to know who is in charge", category: 'sitcom', tags: ["wants","know","charge"], maturity: 'safe' },
  { id: 'char-performs-grief-beautifully-feels-none', name: "Performs grief beautifully and feels none of it", category: 'classic', tags: ["performs","grief","beautifully","feels"], maturity: 'safe' },
  { id: 'char-speaks-verse-talked', name: "Speaks in verse and cannot be talked out of it", category: 'classic', tags: ["speaks","verse","talked"], maturity: 'safe' },
  { id: 'char-insists-nothing-wrong-increasing-volume', name: "Insists nothing is wrong at increasing volume", category: 'sitcom', tags: ["insists","nothing","wrong","increasing"], maturity: 'safe' },
  { id: 'char-aggressively-fine', name: "Is aggressively fine", category: 'sitcom', tags: ["aggressively","fine"], maturity: 'safe' },
  { id: 'char-gun-plan', name: "Has one gun and no plan", category: 'crime', tags: ["gun","plan"], maturity: 'mature' },
  { id: 'char-delighted-things-should-delight', name: "Is delighted by things that should delight nobody", category: 'horror', tags: ["delighted","things","should","delight"], maturity: 'safe' },
  { id: 'char-knows-something-waiting-asked', name: "Knows something and is waiting to be asked", category: 'mystery', tags: ["knows","something","waiting","asked"], maturity: 'safe' },
  { id: 'char-sober-six-hours', name: "Has been sober for six hours", category: 'sitcom', tags: ["sober","six","hours"], maturity: 'mature' },
  { id: 'char-refuses-read-map-principle', name: "Refuses to read the map on principle", category: 'adventure', tags: ["refuses","read","map","principle"], maturity: 'safe' },
  { id: 'char-believes-dreaming-behaves-accordingly', name: "Believes they are dreaming and behaves accordingly", category: 'scifi', tags: ["believes","dreaming","behaves","accordingly"], maturity: 'safe' },
  { id: 'char-compliments-people-way-ruins-afternoon', name: "Compliments people in a way that ruins their afternoon", category: 'sitcom', tags: ["compliments","people","way","ruins"], maturity: 'safe' },
  { id: 'char-fierce-loyalty-brand-mentioned', name: "Has fierce loyalty to a brand nobody mentioned", category: 'sitcom', tags: ["fierce","loyalty","brand","mentioned"], maturity: 'safe' },
  { id: 'char-wants-guess-age', name: "Wants everyone to guess their age", category: 'sitcom', tags: ["wants","guess","age"], maturity: 'safe' },
  { id: 'char-refuses-break-character-crisis', name: "Refuses to break character in a crisis", category: 'classic', tags: ["refuses","break","character","crisis"], maturity: 'safe' },
  { id: 'char-emergency-plan-specific-building', name: "Has an emergency plan for this specific building", category: 'adventure', tags: ["emergency","plan","specific","building"], maturity: 'safe' },
  { id: 'char-anecdote-fit', name: "Has one anecdote and it does not fit here", category: 'sitcom', tags: ["anecdote","fit"], maturity: 'safe' },
  { id: 'char-treats-loyalty-receipt', name: "Treats loyalty as a receipt", category: 'crime', tags: ["treats","loyalty","receipt"], maturity: 'mature' },
  { id: 'char-describes-own-job-way-understands', name: "Describes their own job in a way nobody understands", category: 'workplace', tags: ["describes","own","job","way"], maturity: 'safe' },
  { id: 'char-treats-therapy-reconnaissance', name: "Treats therapy as reconnaissance", category: 'sitcom', tags: ["treats","therapy","reconnaissance"], maturity: 'mature' },
  { id: 'char-sleeps-wrong-people-strategically', name: "Sleeps with the wrong people strategically", category: 'horror', tags: ["sleeps","wrong","people","strategically"], maturity: 'mature' },
  { id: 'char-believes-conspiracy-deeply-boring', name: "Believes in one conspiracy, deeply, and it is boring", category: 'sitcom', tags: ["believes","conspiracy","deeply","boring"], maturity: 'safe' },
  { id: 'char-rule-explain-rule', name: "Has a rule about this and will explain the rule", category: 'sitcom', tags: ["rule","explain","rule"], maturity: 'safe' },
  { id: 'char-quietly-certain-outlive', name: "Is quietly certain they will outlive everyone here", category: 'crime', tags: ["quietly","certain","outlive"], maturity: 'mature' },
  { id: 'char-sell-any-person-room-moderate', name: "Would sell any person in this room for a moderate sum", category: 'crime', tags: ["sell","any","person","room"], maturity: 'mature' },
  { id: 'char-believes-laws-physics-negotiable', name: "Believes the laws of physics are negotiable", category: 'animation', tags: ["believes","laws","physics","negotiable"], maturity: 'safe' },
  { id: 'char-clearly-best-thirty-years-ago', name: "Was clearly the best at this thirty years ago", category: 'sitcom', tags: ["clearly","best","thirty","years"], maturity: 'safe' },
  { id: 'char-explains-technology-length-gets-wrong', name: "Explains the technology at length and gets it wrong", category: 'scifi', tags: ["explains","technology","length","gets"], maturity: 'safe' },
  { id: 'char-keeps-confessing-crimes-commit', name: "Keeps confessing to crimes they did not commit", category: 'crime', tags: ["keeps","confessing","crimes","commit"], maturity: 'mature' },
  { id: 'char-says-i-saying-having-said', name: "Says \"as I was saying\" having said nothing", category: 'sitcom', tags: ["says","saying","having","said"], maturity: 'safe' },
  { id: 'char-times-things-asked-timed', name: "Times things nobody asked to be timed", category: 'sitcom', tags: ["times","things","asked","timed"], maturity: 'safe' },
  { id: 'char-corrects-pronunciation-always-wrongly', name: "Corrects pronunciation, always wrongly", category: 'sitcom', tags: ["corrects","pronunciation","always","wrongly"], maturity: 'safe' },
  { id: 'char-knows-exactly-how-room-dies', name: "Knows exactly how everyone in the room dies", category: 'horror', tags: ["knows","exactly","how","room"], maturity: 'safe' },
  { id: 'char-else-prefer', name: "Will do it if nobody else will, and would prefer to", category: 'crime', tags: ["else","prefer"], maturity: 'mature' },
  { id: 'char-chewing-something-saw-acquire', name: "Is chewing something nobody saw them acquire", category: 'sitcom', tags: ["chewing","something","saw","acquire"], maturity: 'safe' },
  { id: 'char-assumes-any-locked-door', name: "Assumes any locked door is for them", category: 'adventure', tags: ["assumes","any","locked","door"], maturity: 'safe' },
  { id: 'char-interprets-all-silence-agreement', name: "Interprets all silence as agreement", category: 'sitcom', tags: ["interprets","all","silence","agreement"], maturity: 'safe' },
  { id: 'char-certain-room-simulation-keeps-testing', name: "Is certain the room is a simulation and keeps testing it", category: 'scifi', tags: ["certain","room","simulation","keeps"], maturity: 'safe' },
  { id: 'char-thrilled-idea-why', name: "Is thrilled and has no idea why", category: 'animation', tags: ["thrilled","idea","why"], maturity: 'safe' },
  { id: 'char-laughs-full-beat-after-else', name: "Laughs one full beat after everybody else", category: 'sitcom', tags: ["laughs","full","beat","after"], maturity: 'safe' },
  { id: 'char-already-told-story-two', name: "Has already told this story to two of you", category: 'sitcom', tags: ["already","told","story","two"], maturity: 'safe' },
  { id: 'char-suggests-group-photograph-every-escalation', name: "Suggests a group photograph at every escalation", category: 'sitcom', tags: ["suggests","group","photograph","every"], maturity: 'safe' },
  { id: 'char-negotiating-own-life-enjoying', name: "Is negotiating for their own life and enjoying it", category: 'crime', tags: ["negotiating","own","life","enjoying"], maturity: 'mature' },
  { id: 'char-alibi-ready-crime-mentioned', name: "Has an alibi ready for a crime nobody has mentioned", category: 'mystery', tags: ["alibi","ready","crime","mentioned"], maturity: 'safe' },
  { id: 'char-strong-views-correct-way-queue', name: "Has strong views about the correct way to queue", category: 'sitcom', tags: ["strong","views","correct","way"], maturity: 'safe' },
  { id: 'char-mistakes-politeness-devotion', name: "Mistakes politeness for devotion", category: 'romance', tags: ["mistakes","politeness","devotion"], maturity: 'safe' },
  { id: 'char-explains-joke-immediately-after-telling', name: "Explains the joke immediately after telling it", category: 'sitcom', tags: ["explains","joke","immediately","after"], maturity: 'safe' },
  { id: 'char-considers-betrayal-form-feedback', name: "Considers betrayal a form of feedback", category: 'crime', tags: ["considers","betrayal","form","feedback"], maturity: 'mature' },
  { id: 'char-photographs', name: "Has the photographs", category: 'crime', tags: ["photographs"], maturity: 'mature' },
  { id: 'char-introduces-themselves-twice-same-person', name: "Introduces themselves twice to the same person", category: 'sitcom', tags: ["introduces","themselves","twice","same"], maturity: 'safe' },
  { id: 'char-packed-completely-different-trip', name: "Has packed for a completely different trip", category: 'adventure', tags: ["packed","completely","different","trip"], maturity: 'safe' },
  { id: 'char-suspects-correctly-wrong-reasons', name: "Suspects everybody, correctly, for the wrong reasons", category: 'mystery', tags: ["suspects","correctly","wrong","reasons"], maturity: 'safe' },
  { id: 'char-diet-discussing', name: "Is on a diet and will be discussing it", category: 'sitcom', tags: ["diet","discussing"], maturity: 'safe' },
  { id: 'char-considers-themselves-good-judge-character', name: "Considers themselves a good judge of character and is not", category: 'sitcom', tags: ["considers","themselves","good","judge"], maturity: 'safe' },
  { id: 'char-aggressively-relaxed', name: "Is aggressively relaxed", category: 'sitcom', tags: ["aggressively","relaxed"], maturity: 'safe' },
  { id: 'char-answers-rhetorical-questions', name: "Answers rhetorical questions", category: 'sitcom', tags: ["answers","rhetorical","questions"], maturity: 'safe' },
  { id: 'char-gives-directions-places-never', name: "Gives directions to places they have never been", category: 'sitcom', tags: ["gives","directions","places","never"], maturity: 'safe' },
  { id: 'char-believes-flattery-invisible', name: "Believes flattery is invisible", category: 'sitcom', tags: ["believes","flattery","invisible"], maturity: 'safe' },
  { id: 'char-unable-whisper', name: "Is unable to whisper", category: 'sitcom', tags: ["unable","whisper"], maturity: 'safe' },
  { id: 'char-plan-involving-large-mallet', name: "Has a plan involving a very large mallet", category: 'animation', tags: ["plan","involving","large","mallet"], maturity: 'safe' },
  { id: 'char-believes-every-look-meaningful', name: "Believes every look is meaningful", category: 'romance', tags: ["believes","every","look","meaningful"], maturity: 'safe' },
  { id: 'char-speaks-entirely-questions-when-nervous', name: "Speaks entirely in questions when nervous", category: 'sitcom', tags: ["speaks","entirely","questions","when"], maturity: 'safe' },
  { id: 'char-walk-away-dare', name: "Cannot walk away from a dare", category: 'action', tags: ["walk","away","dare"], maturity: 'safe' },
  { id: 'char-move-works', name: "Has one move and it works", category: 'action', tags: ["move","works"], maturity: 'safe' },
  { id: 'char-pass-mirror', name: "Cannot pass a mirror", category: 'sitcom', tags: ["pass","mirror"], maturity: 'safe' },
  { id: 'char-paid-said', name: "Was paid to be here and has said so", category: 'crime', tags: ["paid","said"], maturity: 'mature' },
  { id: 'char-fired-something-still-consider-correct', name: "Was fired for something they still consider correct", category: 'sitcom', tags: ["fired","something","still","consider"], maturity: 'mature' },
  { id: 'char-significantly-less-prepared-stated', name: "Is significantly less prepared than stated", category: 'action', tags: ["significantly","less","prepared","stated"], maturity: 'safe' },
  { id: 'char-told-secret-morning-visibly-holding', name: "Was told a secret this morning and is visibly holding it", category: 'sitcom', tags: ["told","secret","morning","visibly"], maturity: 'safe' },
  { id: 'char-bribes-warmth-genuinely-unsettling', name: "Bribes with a warmth that is genuinely unsettling", category: 'crime', tags: ["bribes","warmth","genuinely","unsettling"], maturity: 'mature' },
  { id: 'char-corrects-record-things-disputed', name: "Corrects the record about things nobody disputed", category: 'sitcom', tags: ["corrects","record","things","disputed"], maturity: 'safe' },
  { id: 'char-reads-every-sign-aloud', name: "Reads every sign aloud", category: 'sitcom', tags: ["reads","every","sign","aloud"], maturity: 'safe' },
  { id: 'char-line-cross-moved-twice', name: "Has one line they will not cross and has moved it twice", category: 'crime', tags: ["line","cross","moved","twice"], maturity: 'mature' },
  { id: 'char-never-lost-argument-because-never', name: "Has never lost an argument because they never concede one", category: 'sitcom', tags: ["never","lost","argument","because"], maturity: 'safe' },
  { id: 'char-recording', name: "Is recording this", category: 'crime', tags: ["recording"], maturity: 'mature' },
  { id: 'char-awake-unreasonable-number-hours', name: "Has been awake for an unreasonable number of hours", category: 'sitcom', tags: ["awake","unreasonable","number","hours"], maturity: 'safe' },
  { id: 'char-taken-something-offered', name: "Has taken something that was not offered", category: 'crime', tags: ["taken","something","offered"], maturity: 'mature' },
  { id: 'char-explains-violence-like-hobby', name: "Explains violence like a hobby", category: 'horror', tags: ["explains","violence","like","hobby"], maturity: 'mature' },
  { id: 'char-confesses-feelings-structurally-catastrophic-moments', name: "Confesses feelings at structurally catastrophic moments", category: 'romance', tags: ["confesses","feelings","structurally","catastrophic"], maturity: 'safe' },
  { id: 'char-being-followed-fine', name: "Is being followed and is fine with it", category: 'horror', tags: ["being","followed","fine"], maturity: 'mature' },
  { id: 'char-keeps-referring-events-happened', name: "Keeps referring to events that have not happened", category: 'scifi', tags: ["keeps","referring","events","happened"], maturity: 'safe' },
  { id: 'char-treats-every-rule-first-offer', name: "Treats every rule as a first offer", category: 'sitcom', tags: ["treats","every","rule","first"], maturity: 'safe' },
  { id: 'char-insists-introducing', name: "Insists on introducing everybody to everybody", category: 'sitcom', tags: ["insists","introducing"], maturity: 'safe' },
  { id: 'char-assumes-worst-often-right', name: "Assumes the worst and is often right", category: 'sitcom', tags: ["assumes","worst","often","right"], maturity: 'safe' },
  { id: 'char-already-decided-scam', name: "Has already decided this is a scam", category: 'sitcom', tags: ["already","decided","scam"], maturity: 'safe' },
  { id: 'char-speaks-animals-equals-people-staff', name: "Speaks to animals as equals and to people as staff", category: 'sitcom', tags: ["speaks","animals","equals","people"], maturity: 'safe' },
  { id: 'char-theory-building', name: "Has a theory about the building", category: 'sitcom', tags: ["theory","building"], maturity: 'safe' },
  { id: 'char-recently-learned-fact-stop-deploying', name: "Has recently learned one fact and cannot stop deploying it", category: 'sitcom', tags: ["recently","learned","fact","stop"], maturity: 'safe' },
  { id: 'char-gets-everyones-name-almost-right', name: "Gets everyone’s name almost right", category: 'sitcom', tags: ["gets","name","almost","right"], maturity: 'safe' },
  { id: 'char-predicts-outcomes-total-confidence-accuracy', name: "Predicts outcomes with total confidence and no accuracy", category: 'scifi', tags: ["predicts","outcomes","total","confidence"], maturity: 'safe' },
  { id: 'char-forged-something-proud-craft', name: "Has forged something and is proud of the craft", category: 'crime', tags: ["forged","something","proud","craft"], maturity: 'mature' },
  { id: 'char-leave-room-under-twenty-minutes', name: "Cannot leave a room in under twenty minutes", category: 'sitcom', tags: ["leave","room","under","twenty"], maturity: 'safe' },
  { id: 'char-notices-wrong-detail-total-confidence', name: "Notices the wrong detail with total confidence", category: 'mystery', tags: ["notices","wrong","detail","total"], maturity: 'safe' },
  { id: 'char-takes-notes-everything-say', name: "Takes notes on everything you say", category: 'mystery', tags: ["takes","notes","everything","say"], maturity: 'safe' },
  { id: 'char-anecdote-runs-nine-minutes', name: "Has an anecdote for this and it runs nine minutes", category: 'sitcom', tags: ["anecdote","runs","nine","minutes"], maturity: 'safe' },
  { id: 'char-wearing-elses-coat', name: "Is wearing somebody else’s coat", category: 'crime', tags: ["wearing","else","coat"], maturity: 'mature' },
  { id: 'char-keeps-list', name: "Keeps a list and you are on it", category: 'sitcom', tags: ["keeps","list"], maturity: 'safe' },
  { id: 'char-clearly-crying-before-came', name: "Was clearly crying before they came in", category: 'sitcom', tags: ["clearly","crying","before","came"], maturity: 'safe' },
  { id: 'char-never-once-allowed-silence-happen', name: "Has never once allowed a silence to happen", category: 'sitcom', tags: ["never","once","allowed","silence"], maturity: 'safe' },
  { id: 'char-doing-impression-room', name: "Is doing an impression of somebody in the room", category: 'sitcom', tags: ["doing","impression","room"], maturity: 'safe' },
  { id: 'char-threatens-people-offering-help', name: "Threatens people by offering to help", category: 'crime', tags: ["threatens","people","offering","help"], maturity: 'mature' },
  { id: 'char-doing-bit-stop', name: "Is doing a bit and will not stop", category: 'sitcom', tags: ["doing","bit","stop"], maturity: 'safe' },
  { id: 'char-never-once-raised-voice-problem', name: "Has never once raised their voice and that is the problem", category: 'crime', tags: ["never","once","raised","voice"], maturity: 'mature' },
  { id: 'char-free-food-said', name: "Is here for the free food and has said so", category: 'sitcom', tags: ["free","food","said"], maturity: 'safe' },
  { id: 'char-strong-opinion-applies-everything', name: "Has one strong opinion and applies it to everything", category: 'sitcom', tags: ["strong","opinion","applies","everything"], maturity: 'safe' },
  { id: 'char-falls-mention-anything', name: "Falls over at the mention of anything", category: 'animation', tags: ["falls","mention","anything"], maturity: 'safe' },
  { id: 'char-considers-themselves-only-adult-present', name: "Considers themselves the only adult present", category: 'workplace', tags: ["considers","themselves","only","adult"], maturity: 'safe' },
  { id: 'char-lawyer-phone-already', name: "Has a lawyer on the phone already", category: 'crime', tags: ["lawyer","phone","already"], maturity: 'mature' },
  { id: 'char-house-before', name: "Has been in this house before", category: 'horror', tags: ["house","before"], maturity: 'safe' },
  { id: 'char-refuses-acknowledge-lost', name: "Refuses to acknowledge that they are lost", category: 'sitcom', tags: ["refuses","acknowledge","lost"], maturity: 'safe' },
  { id: 'char-reacts-everything-maximum-volume', name: "Reacts to everything at maximum volume", category: 'animation', tags: ["reacts","everything","maximum","volume"], maturity: 'safe' },
  { id: 'char-confident-direction-invented', name: "Is confident about a direction they have invented", category: 'adventure', tags: ["confident","direction","invented"], maturity: 'safe' },
  { id: 'char-tell-when-conversation-ended', name: "Cannot tell when a conversation has ended", category: 'sitcom', tags: ["tell","when","conversation","ended"], maturity: 'safe' },
  { id: 'char-under-slightly-false-name', name: "Is here under a slightly false name", category: 'adventure', tags: ["under","slightly","false","name"], maturity: 'safe' },
  { id: 'char-smiles-wrong-moments', name: "Smiles at the wrong moments", category: 'horror', tags: ["smiles","wrong","moments"], maturity: 'safe' },
  { id: 'char-let-anyone-else-finish-sentence', name: "Cannot let anyone else finish a sentence", category: 'sitcom', tags: ["let","anyone","else","finish"], maturity: 'safe' },
  { id: 'char-done-before-several-times', name: "Has done this before, several times", category: 'scifi', tags: ["done","before","several","times"], maturity: 'safe' },
  { id: 'char-rehearsing-conversation-year', name: "Has been rehearsing this conversation for a year", category: 'romance', tags: ["rehearsing","conversation","year"], maturity: 'safe' },
  { id: 'char-falls-love-once-per-scene', name: "Falls in love once per scene", category: 'romance', tags: ["falls","love","once","per"], maturity: 'safe' },
  { id: 'char-insists-going-round-room', name: "Insists on going round the room", category: 'workplace', tags: ["insists","going","round","room"], maturity: 'safe' },
  { id: 'char-rather-die-ask-clarification', name: "Would rather die than ask for clarification", category: 'sitcom', tags: ["rather","die","ask","clarification"], maturity: 'safe' },
  { id: 'char-blackmails-people-gently-almost-kindly', name: "Blackmails people gently, almost kindly", category: 'crime', tags: ["blackmails","people","gently","almost"], maturity: 'mature' },
  { id: 'char-refuses-sit-down', name: "Refuses to sit down", category: 'sitcom', tags: ["refuses","sit","down"], maturity: 'safe' },
  { id: 'char-last-person-see-alive-mentions', name: "Was the last person to see them alive and mentions it constantly", category: 'crime', tags: ["last","person","see","alive"], maturity: 'mature' },
  { id: 'char-uses-word-learnings', name: "Uses the word \"learnings\"", category: 'workplace', tags: ["uses","word","learnings"], maturity: 'safe' },
  { id: 'char-promoted-last-week-recovered', name: "Was promoted last week and has not recovered", category: 'workplace', tags: ["promoted","last","week","recovered"], maturity: 'safe' },
  { id: 'char-practises-signature-during-conversations', name: "Practises their signature during conversations", category: 'sitcom', tags: ["practises","signature","during","conversations"], maturity: 'safe' },
  { id: 'char-insists-paying', name: "Insists on paying and cannot", category: 'sitcom', tags: ["insists","paying"], maturity: 'safe' },
  { id: 'char-lying-qualifications-eleven-years', name: "Has been lying about their qualifications for eleven years", category: 'crime', tags: ["lying","qualifications","eleven","years"], maturity: 'mature' },
  { id: 'char-start-until-sitting-properly', name: "Cannot start until everyone is sitting properly", category: 'sitcom', tags: ["start","until","sitting","properly"], maturity: 'safe' },
  { id: 'char-quietly-furious-something-last-week', name: "Is quietly furious about something from last week", category: 'sitcom', tags: ["quietly","furious","something","last"], maturity: 'safe' },
  { id: 'char-keeps-everyones-secrets-mentions-often', name: "Keeps everyone’s secrets and mentions this often", category: 'crime', tags: ["keeps","secrets","mentions","often"], maturity: 'mature' },
  { id: 'char-explains-own-job', name: "Explains your own job to you", category: 'sitcom', tags: ["explains","own","job"], maturity: 'safe' },
  { id: 'char-trying-hard-seem-taller', name: "Is trying very hard to seem taller", category: 'sitcom', tags: ["trying","hard","seem","taller"], maturity: 'safe' },
  { id: 'char-owes-debt-something-yet-collected', name: "Owes a debt to something that has not yet collected", category: 'fantasy', tags: ["owes","debt","something","yet"], maturity: 'safe' },
  { id: 'char-prison-say', name: "Has been to prison and will not say what for", category: 'crime', tags: ["prison","say"], maturity: 'mature' },
  { id: 'char-done-something-unforgivable-again', name: "Has done something unforgivable and would do it again", category: 'crime', tags: ["done","something","unforgivable","again"], maturity: 'mature' },
  { id: 'char-announces-plan-while-failing', name: "Announces the plan while it is failing", category: 'action', tags: ["announces","plan","while","failing"], maturity: 'safe' },
  { id: 'char-poisoned-once-mildly-lesson', name: "Has poisoned somebody once, mildly, as a lesson", category: 'horror', tags: ["poisoned","once","mildly","lesson"], maturity: 'mature' },
  { id: 'char-counts-down-loud-incorrectly', name: "Counts down out loud, incorrectly", category: 'action', tags: ["counts","down","loud","incorrectly"], maturity: 'safe' },
  { id: 'char-already-forgiven-something', name: "Has already forgiven you for something", category: 'sitcom', tags: ["already","forgiven","something"], maturity: 'safe' },
  { id: 'char-considers-cruelty-form-honesty', name: "Considers cruelty a form of honesty", category: 'horror', tags: ["considers","cruelty","form","honesty"], maturity: 'mature' },
  { id: 'char-stop-touching-things-labelled-touch', name: "Will not stop touching things labelled do not touch", category: 'animation', tags: ["stop","touching","things","labelled"], maturity: 'safe' },
  { id: 'char-assumes-funniest-person', name: "Assumes they are the funniest person here", category: 'sitcom', tags: ["assumes","funniest","person"], maturity: 'safe' },
  { id: 'char-believes-undercover', name: "Believes they are undercover", category: 'adventure', tags: ["believes","undercover"], maturity: 'safe' },
  { id: 'char-like-know-selfdefence', name: "Would like everyone to know it was self-defence", category: 'crime', tags: ["like","know","self-defence"], maturity: 'mature' },
  { id: 'char-tries-shake-hands-people-midargument', name: "Tries to shake hands with people mid-argument", category: 'sitcom', tags: ["tries","shake","hands","people"], maturity: 'safe' },
  { id: 'char-refuses-all-offers-three-times', name: "Refuses all offers three times as a matter of form", category: 'sitcom', tags: ["refuses","all","offers","three"], maturity: 'safe' },
  { id: 'char-high-hosting', name: "Is high and hosting", category: 'sitcom', tags: ["high","hosting"], maturity: 'mature' },
  { id: 'char-finishes-other-peoples-anecdotes-wrongly', name: "Finishes other people’s anecdotes wrongly", category: 'sitcom', tags: ["finishes","other","people","anecdotes"], maturity: 'safe' },
  { id: 'char-currently-pretending-else-bad', name: "Is currently pretending to be somebody else and is bad at it", category: 'adventure', tags: ["currently","pretending","else","bad"], maturity: 'safe' },
  { id: 'char-explains-why-late-longer-late', name: "Explains why they are late for longer than they were late", category: 'sitcom', tags: ["explains","why","late","longer"], maturity: 'safe' },
  { id: 'char-opinion-acoustics', name: "Has an opinion on the acoustics", category: 'sitcom', tags: ["opinion","acoustics"], maturity: 'safe' },
  { id: 'char-offers-bargains-asked', name: "Offers bargains nobody asked for", category: 'fantasy', tags: ["offers","bargains","asked"], maturity: 'safe' },
  { id: 'char-skimming-years-nearly-caught', name: "Has been skimming for years and is nearly caught", category: 'crime', tags: ["skimming","years","nearly","caught"], maturity: 'mature' },
  { id: 'char-blink', name: "Does not blink", category: 'horror', tags: ["blink"], maturity: 'safe' },
  { id: 'char-collect', name: "Is here to collect", category: 'crime', tags: ["collect"], maturity: 'mature' },
  { id: 'char-keeps-score-favours-going-back', name: "Keeps score of favours going back eleven years", category: 'sitcom', tags: ["keeps","score","favours","going"], maturity: 'safe' },
  { id: 'char-believes-promised-something', name: "Believes they were promised something", category: 'sitcom', tags: ["believes","promised","something"], maturity: 'safe' },
  { id: 'char-loudly-whispering', name: "Is loudly whispering", category: 'sitcom', tags: ["loudly","whispering"], maturity: 'safe' },
  { id: 'char-approve-anything-without-second-opinion', name: "Will not approve anything without a second opinion they never seek", category: 'workplace', tags: ["approve","anything","without","second"], maturity: 'safe' },
  { id: 'char-says-long-story-tells', name: "Says \"long story\" and then tells it", category: 'sitcom', tags: ["says","long","story","tells"], maturity: 'safe' },
  { id: 'char-allergy-changes-depending-menu', name: "Has an allergy that changes depending on the menu", category: 'sitcom', tags: ["allergy","changes","depending","menu"], maturity: 'safe' },
  { id: 'char-considers-audition', name: "Considers this an audition", category: 'sitcom', tags: ["considers","audition"], maturity: 'mature' },
  { id: 'char-already-named-children', name: "Has already named the children", category: 'romance', tags: ["already","named","children"], maturity: 'safe' },
  { id: 'char-books-meetings-prepare-meetings', name: "Books meetings to prepare for meetings", category: 'workplace', tags: ["books","meetings","prepare","meetings"], maturity: 'safe' },
  { id: 'char-treats-every-exit-curtain-call', name: "Treats every exit as a curtain call", category: 'classic', tags: ["treats","every","exit","curtain"], maturity: 'safe' },
  { id: 'char-escalates-everything-manager-exist', name: "Escalates everything to a manager who does not exist", category: 'workplace', tags: ["escalates","everything","manager","exist"], maturity: 'safe' },
  { id: 'char-alibi-only-works-checks-time', name: "Has an alibi that only works if nobody checks the time", category: 'crime', tags: ["alibi","only","works","checks"], maturity: 'mature' },
  { id: 'char-asks-how-much-everything-cost', name: "Asks how much everything cost", category: 'sitcom', tags: ["asks","how","much","everything"], maturity: 'safe' },
  { id: 'char-urgent-errand-elsewhere-leave', name: "Has an urgent errand elsewhere and will not leave", category: 'sitcom', tags: ["urgent","errand","elsewhere","leave"], maturity: 'safe' },
  { id: 'char-hired-role-longer-exists-told', name: "Was hired for a role that no longer exists and has not been told", category: 'workplace', tags: ["hired","role","longer","exists"], maturity: 'safe' },
  { id: 'char-reason-smell', name: "Is the reason for the smell", category: 'sitcom', tags: ["reason","smell"], maturity: 'mature' },
  { id: 'char-turns-every-decision-workshop', name: "Turns every decision into a workshop", category: 'workplace', tags: ["turns","every","decision","workshop"], maturity: 'safe' },
  { id: 'char-speaks-only-proverbs-none-real', name: "Speaks only in proverbs, none of them real", category: 'classic', tags: ["speaks","only","proverbs","none"], maturity: 'safe' },
  { id: 'char-fourth-identity-losing-track', name: "Is on their fourth identity and losing track", category: 'crime', tags: ["fourth","identity","losing","track"], maturity: 'mature' },
  { id: 'char-insists-called-ahead', name: "Insists they called ahead", category: 'sitcom', tags: ["insists","called","ahead"], maturity: 'safe' },
  { id: 'char-owed-money-three-people-room', name: "Is owed money by three people in this room", category: 'crime', tags: ["owed","money","three","people"], maturity: 'mature' },
  { id: 'char-aside-everything', name: "Has an aside for everything", category: 'classic', tags: ["aside","everything"], maturity: 'safe' },
  { id: 'char-considers-themselves-audience', name: "Considers themselves the audience", category: 'sitcom', tags: ["considers","themselves","audience"], maturity: 'safe' },
  { id: 'char-like-make-small-point-length', name: "Would like to make one small point, at length", category: 'sitcom', tags: ["like","make","small","point"], maturity: 'safe' },
  { id: 'char-regifts-things-front-person-gave', name: "Re-gifts things in front of the person who gave them", category: 'sitcom', tags: ["re-gifts","things","front","person"], maturity: 'safe' },
  { id: 'char-unfailingly-polite-while-ruining', name: "Is unfailingly polite while ruining you", category: 'crime', tags: ["unfailingly","polite","while","ruining"], maturity: 'mature' },
  { id: 'char-owes-favour-wants-name', name: "Owes a favour to somebody nobody wants to name", category: 'crime', tags: ["owes","favour","wants","name"], maturity: 'mature' },
  { id: 'char-addresses-room-though-much-larger', name: "Addresses the room as though it were a much larger room", category: 'classic', tags: ["addresses","room","though","much"], maturity: 'safe' },
  { id: 'char-receive-compliment-without-dismantling', name: "Cannot receive a compliment without dismantling it", category: 'sitcom', tags: ["receive","compliment","without","dismantling"], maturity: 'safe' },
  { id: 'char-keeps-offering-help-ways-make', name: "Keeps offering to help in ways that make it worse", category: 'sitcom', tags: ["keeps","offering","help","ways"], maturity: 'safe' },
  { id: 'char-solves-first-minute-ignored', name: "Solves it in the first minute and is ignored", category: 'mystery', tags: ["solves","first","minute","ignored"], maturity: 'safe' },
  { id: 'char-raised-people-specific-views-cutlery', name: "Was raised by people with very specific views on cutlery", category: 'sitcom', tags: ["raised","people","specific","views"], maturity: 'safe' },
  { id: 'char-treats-grief-opportunity', name: "Treats grief as an opportunity", category: 'horror', tags: ["treats","grief","opportunity"], maturity: 'mature' },
  { id: 'char-already-chosen-blame', name: "Has already chosen who to blame", category: 'crime', tags: ["already","chosen","blame"], maturity: 'mature' },
  { id: 'char-like-revisit-decision-made-2011', name: "Would like to revisit a decision made in 2011", category: 'sitcom', tags: ["like","revisit","decision","made"], maturity: 'safe' },
  { id: 'char-convinced-else-briefed', name: "Is convinced everyone else was briefed", category: 'sitcom', tags: ["convinced","else","briefed"], maturity: 'safe' },
  { id: 'char-wish-left-being-careful', name: "Has one wish left and is being very careful", category: 'fantasy', tags: ["wish","left","being","careful"], maturity: 'safe' },
  { id: 'char-use-word-where-nine-available', name: "Will not use one word where nine are available", category: 'classic', tags: ["use","word","where","nine"], maturity: 'safe' },
  { id: 'char-being-extremely-normal', name: "Is being extremely normal about it", category: 'romance', tags: ["being","extremely","normal"], maturity: 'safe' },
  { id: 'char-reacts-compliments-though-accused', name: "Reacts to compliments as though accused", category: 'sitcom', tags: ["reacts","compliments","though","accused"], maturity: 'safe' },
  { id: 'char-speaks-politely-something-else-see', name: "Speaks politely to something nobody else can see", category: 'fantasy', tags: ["speaks","politely","something","else"], maturity: 'safe' },
  { id: 'char-answers-questions-better-questions', name: "Answers questions with better questions", category: 'mystery', tags: ["answers","questions","better","questions"], maturity: 'safe' },
  { id: 'char-keeps-checking-phone-receiving-nothing', name: "Keeps checking a phone that is receiving nothing", category: 'sitcom', tags: ["keeps","checking","phone","receiving"], maturity: 'safe' },
  { id: 'char-trusted-near-unattended-microphone', name: "Cannot be trusted near an unattended microphone", category: 'sitcom', tags: ["trusted","near","unattended","microphone"], maturity: 'safe' },
  { id: 'char-breaks-people-agreed-date', name: "Breaks up with people who have not agreed to date them", category: 'romance', tags: ["breaks","people","agreed","date"], maturity: 'safe' },
  { id: 'char-body-count-spreadsheet', name: "Has a body count and a spreadsheet", category: 'sitcom', tags: ["body","count","spreadsheet"], maturity: 'mature' },
  { id: 'char-slide-deck', name: "Has a slide deck for this", category: 'workplace', tags: ["slide","deck"], maturity: 'safe' },
  { id: 'char-sends-followup-email-during-meeting', name: "Sends the follow-up email during the meeting", category: 'workplace', tags: ["sends","follow-up","email","during"], maturity: 'safe' },
  { id: 'char-refuses-say-living', name: "Refuses to say what they do for a living", category: 'sitcom', tags: ["refuses","say","living"], maturity: 'safe' },
  { id: 'char-enjoys-part-where-cry', name: "Enjoys the part where they cry", category: 'sitcom', tags: ["enjoys","part","where","cry"], maturity: 'mature' },
  { id: 'char-assumes-invited', name: "Assumes they were invited", category: 'sitcom', tags: ["assumes","invited"], maturity: 'safe' },
  { id: 'char-stop-talking-divorce', name: "Cannot stop talking about their divorce", category: 'sitcom', tags: ["stop","talking","divorce"], maturity: 'mature' },
  { id: 'char-recently-told-prophecy-coping-badly', name: "Has recently been told a prophecy and is coping badly", category: 'fantasy', tags: ["recently","told","prophecy","coping"], maturity: 'safe' },
  { id: 'char-treats-every-stranger-longlost-friend', name: "Treats every stranger as a long-lost friend", category: 'sitcom', tags: ["treats","every","stranger","long-lost"], maturity: 'safe' },
  { id: 'char-stop-confessing-minor-things', name: "Cannot stop confessing to minor things", category: 'sitcom', tags: ["stop","confessing","minor","things"], maturity: 'safe' },
  { id: 'char-reacts-bad-news-immediate-logistics', name: "Reacts to bad news with immediate logistics", category: 'sitcom', tags: ["reacts","bad","news","immediate"], maturity: 'safe' },
]

// ============================================================================
// SETTINGS
// ============================================================================

export const SETTINGS: ContentItem[] = [
  { id: 'set-provincial-radio-station-three-morning', name: "A Provincial Radio Station At Three In The Morning", category: 'sitcom', tags: ["provincial","radio","station","three"], maturity: 'safe' },
  { id: 'set-hotel-conference-suite-set-ninety', name: "A Hotel Conference Suite Set For Ninety And Attended By Four", category: 'sitcom', tags: ["hotel","conference","suite","set"], maturity: 'safe' },
  { id: 'set-sheriffs-office-cell-two-prisoners', name: "A Sheriff’s Office With One Cell And Two Prisoners", category: 'mystery', tags: ["sheriff","office","cell","two"], maturity: 'safe' },
  { id: 'set-culdesac-where-watching-through-nets', name: "A Cul-De-Sac Where Everybody Is Watching Through Nets", category: 'crime', tags: ["cul-de-sac","where","watching","through"], maturity: 'mature' },
  { id: 'set-cellar-bar-advertise', name: "A Cellar Bar That Does Not Advertise", category: 'crime', tags: ["cellar","bar","advertise"], maturity: 'mature' },
  { id: 'set-garden-centre-caf-closing-time', name: "A Garden Centre Café At Closing Time", category: 'sitcom', tags: ["garden","centre","caf","closing"], maturity: 'safe' },
  { id: 'set-nature-reserve-hide-nothing-see', name: "A Nature Reserve Hide With Nothing To See", category: 'adventure', tags: ["nature","reserve","hide","nothing"], maturity: 'safe' },
  { id: 'set-boardroom-where-already-voted', name: "A Boardroom Where Everybody Has Already Voted", category: 'crime', tags: ["boardroom","where","already","voted"], maturity: 'mature' },
  { id: 'set-allnight-laundrette-working-machine-queue', name: "An All-Night Laundrette With One Working Machine And A Queue", category: 'sitcom', tags: ["all-night","laundrette","working","machine"], maturity: 'safe' },
  { id: 'set-nightclub-office-music-coming-through', name: "A Nightclub Office With The Music Coming Through The Wall", category: 'crime', tags: ["nightclub","office","music","coming"], maturity: 'mature' },
  { id: 'set-barbers-three-chairs-barber', name: "A Barber’s With Three Chairs And One Barber", category: 'sitcom', tags: ["barber","three","chairs","barber"], maturity: 'safe' },
  { id: 'set-park-bench-chosen-sightlines', name: "A Park Bench Chosen For Its Sightlines", category: 'mystery', tags: ["park","bench","chosen","sightlines"], maturity: 'safe' },
  { id: 'set-prison-visiting-hall-wet-tuesday', name: "A Prison Visiting Hall On A Wet Tuesday", category: 'crime', tags: ["prison","visiting","hall","wet"], maturity: 'mature' },
  { id: 'set-multistorey-car-park-where-barrier', name: "A Multi-Storey Car Park Where The Barrier Has Failed", category: 'adventure', tags: ["multi-storey","car","park","where"], maturity: 'safe' },
  { id: 'set-island-goat-rifle-four-survivors', name: "An Island With One Goat, One Rifle And Four Survivors", category: 'adventure', tags: ["island","goat","rifle","four"], maturity: 'safe' },
  { id: 'set-sauna-occupied-strangers-leave-first', name: "A Sauna Occupied By Strangers Who Will Not Leave First", category: 'sitcom', tags: ["sauna","occupied","strangers","leave"], maturity: 'safe' },
  { id: 'set-hospital-corridor-hour-visits', name: "A Hospital Corridor At The Hour Nobody Visits", category: 'crime', tags: ["hospital","corridor","hour","visits"], maturity: 'mature' },
  { id: 'set-blasted-heath-cauldron-bad-weather', name: "A Blasted Heath With A Cauldron And Bad Weather", category: 'classic', tags: ["blasted","heath","cauldron","bad"], maturity: 'safe' },
  { id: 'set-night-bus-going-long-way', name: "A Night Bus Going The Long Way Round", category: 'sitcom', tags: ["night","bus","going","long"], maturity: 'safe' },
  { id: 'set-tram-standstill-between-two-stops', name: "A Tram At A Standstill Between Two Stops", category: 'adventure', tags: ["tram","standstill","between","two"], maturity: 'safe' },
  { id: 'set-ships-log-being-written-running', name: "A Ship’s Log Being Written By Somebody Running Out Of Crew", category: 'horror', tags: ["ship","log","being","written"], maturity: 'safe' },
  { id: 'set-kitchen-during-twenty-minutes-before', name: "A Kitchen During The Twenty Minutes Before Guests Arrive", category: 'sitcom', tags: ["kitchen","during","twenty","minutes"], maturity: 'safe' },
  { id: 'set-back-office-shop-only-sells', name: "The Back Office Of A Shop That Only Sells Left Shoes", category: 'sitcom', tags: ["back","office","shop","only"], maturity: 'safe' },
  { id: 'set-ferrymans-boat-wide-slow-river', name: "A Ferryman’s Boat On A Very Wide, Very Slow River", category: 'fantasy', tags: ["ferryman","boat","wide","slow"], maturity: 'safe' },
  { id: 'set-rented-flat-deposit-already-written', name: "A Rented Flat With The Deposit Already Written Off", category: 'crime', tags: ["rented","flat","deposit","already"], maturity: 'mature' },
  { id: 'set-car-being-driven-somewhere-named', name: "A Car Being Driven Somewhere Nobody Named", category: 'crime', tags: ["car","being","driven","somewhere"], maturity: 'mature' },
  { id: 'set-whaling-ship-captained-fixation', name: "A Whaling Ship Captained By Somebody With One Fixation", category: 'classic', tags: ["whaling","ship","captained","fixation"], maturity: 'safe' },
  { id: 'set-duel-dawn-both-parties-regretting', name: "A Duel At Dawn, Both Parties Regretting It", category: 'adventure', tags: ["duel","dawn","both","parties"], maturity: 'safe' },
  { id: 'set-tea-table-where-move-seats', name: "A Tea Table Where Everybody Must Move Seats On The Hour", category: 'classic', tags: ["tea","table","where","move"], maturity: 'safe' },
  { id: 'set-long-corridor-hospital-visiting-hour', name: "A Long Corridor In A Hospital At Visiting Hour", category: 'sitcom', tags: ["long","corridor","hospital","visiting"], maturity: 'safe' },
  { id: 'set-village-fte-torrential-rain-acknowledge', name: "A Village Fête In Torrential Rain That Nobody Will Acknowledge", category: 'sitcom', tags: ["village","torrential","rain","acknowledge"], maturity: 'safe' },
  { id: 'set-casino-floor-hour-cameras-reboot', name: "A Casino Floor At The Hour The Cameras Reboot", category: 'crime', tags: ["casino","floor","hour","cameras"], maturity: 'mature' },
  { id: 'set-waiting-room-between-two-interview', name: "A Waiting Room Between Two Interview Rooms", category: 'crime', tags: ["waiting","room","between","two"], maturity: 'mature' },
  { id: 'set-loft-conversion-two-years-threeweek', name: "A Loft Conversion Two Years Into A Three-Week Job", category: 'workplace', tags: ["loft","conversion","two","years"], maturity: 'safe' },
  { id: 'set-photo-booth-four-people', name: "A Photo Booth With Four People In It", category: 'sitcom', tags: ["photo","booth","four","people"], maturity: 'safe' },
  { id: 'set-ice-rink-being-resurfaced-slowly', name: "An Ice Rink Being Resurfaced Very Slowly", category: 'workplace', tags: ["ice","rink","being","resurfaced"], maturity: 'safe' },
  { id: 'set-village-hall-quiz-tiebreak', name: "A Village Hall Quiz At The Tie-Break", category: 'sitcom', tags: ["village","hall","quiz","tie-break"], maturity: 'safe' },
  { id: 'set-escape-room-staff-gone-home', name: "An Escape Room The Staff Have Gone Home From", category: 'adventure', tags: ["escape","room","staff","gone"], maturity: 'safe' },
  { id: 'set-dentists-waiting-room-magazine-1998', name: "A Dentist’s Waiting Room With One Magazine From 1998", category: 'sitcom', tags: ["dentist","waiting","room","magazine"], maturity: 'safe' },
  { id: 'set-rehearsal-room-wrong-instruments', name: "A Rehearsal Room With The Wrong Instruments In It", category: 'sitcom', tags: ["rehearsal","room","wrong","instruments"], maturity: 'safe' },
  { id: 'set-wine-tasting-gone-too-long', name: "A Wine Tasting That Has Gone On Too Long", category: 'sitcom', tags: ["wine","tasting","gone","too"], maturity: 'safe' },
  { id: 'set-green-room-show-cancelled-midbroadcast', name: "The Green Room Of A Show Cancelled Mid-Broadcast", category: 'sitcom', tags: ["green","room","show","cancelled"], maturity: 'safe' },
  { id: 'set-debtors-prison-christmas', name: "A Debtors’ Prison At Christmas", category: 'classic', tags: ["debtors","prison","christmas"], maturity: 'safe' },
  { id: 'set-border-crossing-bad-hour', name: "A Border Crossing At A Bad Hour", category: 'crime', tags: ["border","crossing","bad","hour"], maturity: 'mature' },
  { id: 'set-zoo-enclosure-between-occupants', name: "A Zoo Enclosure Between Occupants", category: 'horror', tags: ["zoo","enclosure","between","occupants"], maturity: 'safe' },
  { id: 'set-municipal-library-after-last-announcement', name: "A Municipal Library After The Last Announcement", category: 'classic', tags: ["municipal","library","after","last"], maturity: 'safe' },
  { id: 'set-castle-top-long-staircase-carpathians', name: "A Castle At The Top Of A Very Long Staircase In The Carpathians", category: 'horror', tags: ["castle","top","long","staircase"], maturity: 'safe' },
  { id: 'set-attic-entered-since-funeral', name: "An Attic Nobody Has Entered Since The Funeral", category: 'mystery', tags: ["attic","entered","since","funeral"], maturity: 'safe' },
  { id: 'set-checkpoint-divided-city-both-sides', name: "A Checkpoint In A Divided City, Both Sides Watching", category: 'mystery', tags: ["checkpoint","divided","city","both"], maturity: 'safe' },
  { id: 'set-funeral-wake-where-sit-widow', name: "A Funeral Wake Where Nobody Will Sit With The Widow", category: 'crime', tags: ["funeral","wake","where","sit"], maturity: 'mature' },
  { id: 'set-ferry-boarding-six-hours', name: "A Ferry That Has Been Boarding For Six Hours", category: 'sitcom', tags: ["ferry","boarding","six","hours"], maturity: 'safe' },
  { id: 'set-departure-lounge-flight-keeps-changing', name: "A Departure Lounge For A Flight That Keeps Changing Gate", category: 'sitcom', tags: ["departure","lounge","flight","keeps"], maturity: 'safe' },
  { id: 'set-labyrinth-thread-map', name: "A Labyrinth With One Thread And No Map", category: 'fantasy', tags: ["labyrinth","thread","map"], maturity: 'safe' },
  { id: 'set-tower-door-window', name: "A Tower With No Door And One Window", category: 'fantasy', tags: ["tower","door","window"], maturity: 'safe' },
  { id: 'set-cinema-screening-something-chose', name: "A Cinema Screening Something Nobody Chose", category: 'sitcom', tags: ["cinema","screening","something","chose"], maturity: 'safe' },
  { id: 'set-drawing-room-where-five-daughters', name: "A Drawing Room Where Five Daughters Must Be Married Off", category: 'classic', tags: ["drawing","room","where","five"], maturity: 'safe' },
  { id: 'set-aquarium-gift-shop-during-fire', name: "An Aquarium Gift Shop During A Fire Drill", category: 'workplace', tags: ["aquarium","gift","shop","during"], maturity: 'safe' },
  { id: 'set-church-confessional-queue', name: "A Church Confessional With A Queue Of One", category: 'crime', tags: ["church","confessional","queue"], maturity: 'mature' },
  { id: 'set-striplit-corridor-where-cameras-point', name: "A Strip-Lit Corridor Where The Cameras Point Away", category: 'crime', tags: ["strip-lit","corridor","where","cameras"], maturity: 'mature' },
  { id: 'set-boat-hire-kiosk-lake-boats', name: "A Boat Hire Kiosk On A Lake With No Boats", category: 'adventure', tags: ["boat","hire","kiosk","lake"], maturity: 'safe' },
  { id: 'set-coach-trip-stopped-knows-why', name: "A Coach Trip That Has Stopped And Nobody Knows Why", category: 'adventure', tags: ["coach","trip","stopped","knows"], maturity: 'safe' },
  { id: 'set-stairwell-between-two-locked-fire', name: "A Stairwell Between Two Locked Fire Doors", category: 'mystery', tags: ["stairwell","between","two","locked"], maturity: 'safe' },
  { id: 'set-balcony-garden-below-being-overheard', name: "A Balcony, A Garden Below, And Somebody Being Overheard", category: 'classic', tags: ["balcony","garden","below","being"], maturity: 'safe' },
  { id: 'set-laboratory-thunderstorm-sheet-something', name: "A Laboratory In A Thunderstorm With A Sheet Over Something", category: 'horror', tags: ["laboratory","thunderstorm","sheet","something"], maturity: 'safe' },
  { id: 'set-cable-car-halfway-across-moving', name: "A Cable Car Halfway Across And Not Moving", category: 'adventure', tags: ["cable","car","halfway","across"], maturity: 'safe' },
  { id: 'set-charity-shop-where-everything-somehow', name: "A Charity Shop Where Everything Is Somehow The Wrong Size", category: 'sitcom', tags: ["charity","shop","where","everything"], maturity: 'safe' },
  { id: 'set-lockup-rented-cash-under-name', name: "A Lock-Up Rented In Cash Under A Name Nobody Checked", category: 'crime', tags: ["lock-up","rented","cash","under"], maturity: 'mature' },
  { id: 'set-fitting-room-curtain-close', name: "A Fitting Room With A Curtain That Does Not Close", category: 'workplace', tags: ["fitting","room","curtain","close"], maturity: 'safe' },
  { id: 'set-sance-house-good-acoustics', name: "A Séance In A House With Very Good Acoustics", category: 'horror', tags: ["ance","house","good","acoustics"], maturity: 'safe' },
  { id: 'set-court-where-king-just-divided', name: "A Court Where A King Has Just Divided His Kingdom Badly", category: 'classic', tags: ["court","where","king","just"], maturity: 'safe' },
  { id: 'set-greenhouse-full-sun-door-jammed', name: "A Greenhouse In Full Sun With The Door Jammed", category: 'horror', tags: ["greenhouse","full","sun","door"], maturity: 'safe' },
  { id: 'set-museum-wing-closed-public-occupied', name: "A Museum Wing Closed To The Public And Occupied Anyway", category: 'mystery', tags: ["museum","wing","closed","public"], maturity: 'safe' },
  { id: 'set-lift-stuck-between-floors-building', name: "A Lift Stuck Between Floors In A Building With No Thirteenth Floor", category: 'sitcom', tags: ["lift","stuck","between","floors"], maturity: 'safe' },
  { id: 'set-speakeasy-behind-door-requiring-word', name: "A Speakeasy Behind A Door Requiring A Word Nobody Remembers", category: 'mystery', tags: ["speakeasy","behind","door","requiring"], maturity: 'safe' },
  { id: 'set-country-lane-car-abandoned-well', name: "A Country Lane With A Car Abandoned Well", category: 'crime', tags: ["country","lane","car","abandoned"], maturity: 'mature' },
  { id: 'set-panel-room-where-recording-light', name: "A Panel Room Where The Recording Light Is Off", category: 'crime', tags: ["panel","room","where","recording"], maturity: 'mature' },
  { id: 'set-function-room-above-pub-booked', name: "A Function Room Above A Pub, Booked Under The Wrong Name", category: 'sitcom', tags: ["function","room","above","pub"], maturity: 'safe' },
  { id: 'set-motel-room-paid-week-advance', name: "A Motel Room Paid For A Week In Advance", category: 'crime', tags: ["motel","room","paid","week"], maturity: 'mature' },
  { id: 'set-corridor-identical-doors-wrong', name: "A Corridor Of Identical Doors And One Wrong One", category: 'sitcom', tags: ["corridor","identical","doors","wrong"], maturity: 'safe' },
  { id: 'set-farmhouse-kitchen-too-many-phones', name: "A Farmhouse Kitchen With Too Many Phones On The Table", category: 'crime', tags: ["farmhouse","kitchen","too","many"], maturity: 'mature' },
  { id: 'set-chapel-booked-short-notice', name: "A Chapel Booked At Very Short Notice", category: 'crime', tags: ["chapel","booked","short","notice"], maturity: 'mature' },
  { id: 'set-car-long-drive-ninety-minutes', name: "A Car On A Long Drive With Ninety Minutes Left", category: 'sitcom', tags: ["car","long","drive","ninety"], maturity: 'safe' },
  { id: 'set-back-room-where-chairs-face', name: "A Back Room Where The Chairs Face One Way", category: 'crime', tags: ["back","room","where","chairs"], maturity: 'mature' },
  { id: 'set-wedding-reception-where-two-families', name: "A Wedding Reception Where Two Families Are Counting", category: 'crime', tags: ["wedding","reception","where","two"], maturity: 'mature' },
  { id: 'set-ball-ends-midnight-sharp', name: "A Ball That Ends At Midnight, Sharp", category: 'fantasy', tags: ["ball","ends","midnight","sharp"], maturity: 'safe' },
  { id: 'set-ski-lift-stopped-view', name: "A Ski Lift Stopped With A View", category: 'adventure', tags: ["ski","lift","stopped","view"], maturity: 'safe' },
  { id: 'set-corner-shop-two-minutes-past', name: "A Corner Shop At Two Minutes Past Closing", category: 'sitcom', tags: ["corner","shop","two","minutes"], maturity: 'safe' },
  { id: 'set-lake-hand-coming-holding-something', name: "A Lake With A Hand Coming Out Of It, Holding Something", category: 'fantasy', tags: ["lake","hand","coming","holding"], maturity: 'safe' },
  { id: 'set-mountain-where-chained-extremely-bored', name: "A Mountain Where Somebody Is Chained And Extremely Bored", category: 'fantasy', tags: ["mountain","where","chained","extremely"], maturity: 'safe' },
  { id: 'set-car-park-where-parked-extremely', name: "A Car Park Where Somebody Has Parked Extremely Badly", category: 'workplace', tags: ["car","park","where","parked"], maturity: 'safe' },
  { id: 'set-marina-where-boat-engine-running', name: "A Marina Where One Boat Has Its Engine Running", category: 'crime', tags: ["marina","where","boat","engine"], maturity: 'mature' },
  { id: 'set-field-dawn-two-spades', name: "A Field At Dawn With Two Spades", category: 'crime', tags: ["field","dawn","two","spades"], maturity: 'mature' },
  { id: 'set-bus-shelter-storm', name: "A Bus Shelter In A Storm", category: 'sitcom', tags: ["bus","shelter","storm"], maturity: 'safe' },
  { id: 'set-submarine-silent-running', name: "A Submarine At Silent Running", category: 'adventure', tags: ["submarine","silent","running"], maturity: 'safe' },
  { id: 'set-latenight-kebab-shop-nowhere-else', name: "A Late-Night Kebab Shop With Nowhere Else To Go", category: 'crime', tags: ["late-night","kebab","shop","nowhere"], maturity: 'mature' },
  { id: 'set-church-hall-booked-two-groups', name: "A Church Hall Booked By Two Groups At Once", category: 'sitcom', tags: ["church","hall","booked","two"], maturity: 'safe' },
  { id: 'set-motorway-services-four-morning-during', name: "A Motorway Services At Four In The Morning During A Power Cut", category: 'sitcom', tags: ["motorway","services","four","morning"], maturity: 'safe' },
  { id: 'set-waiting-room-practice-name', name: "The Waiting Room Of A Practice Nobody Can Name", category: 'sitcom', tags: ["waiting","room","practice","name"], maturity: 'safe' },
  { id: 'set-newsroom-sitting-something', name: "A Newsroom Sitting On Something", category: 'crime', tags: ["newsroom","sitting","something"], maturity: 'mature' },
  { id: 'set-municipal-swimming-pool-drained-three', name: "A Municipal Swimming Pool Drained Three Years Ago For Repairs", category: 'sitcom', tags: ["municipal","swimming","pool","drained"], maturity: 'safe' },
  { id: 'set-moor-night-light-distant-window', name: "A Moor At Night With A Light In A Distant Window", category: 'classic', tags: ["moor","night","light","distant"], maturity: 'safe' },
  { id: 'set-portacabin-building-site-lunch', name: "A Portacabin On A Building Site At Lunch", category: 'adventure', tags: ["portacabin","building","site","lunch"], maturity: 'safe' },
  { id: 'set-counting-house-cold-christmas-eve', name: "A Counting House On A Very Cold Christmas Eve", category: 'classic', tags: ["counting","house","cold","christmas"], maturity: 'safe' },
  { id: 'set-round-table-empty-seat', name: "A Round Table With One Empty Seat", category: 'fantasy', tags: ["round","table","empty","seat"], maturity: 'safe' },
  { id: 'set-rainslick-office-above-sign-flickers', name: "A Rain-Slick Office Above A Sign That Flickers", category: 'mystery', tags: ["rain-slick","office","above","sign"], maturity: 'safe' },
  { id: 'set-recording-studio-booked-hour-fifty', name: "A Recording Studio Booked By The Hour, Fifty Minutes Gone", category: 'sitcom', tags: ["recording","studio","booked","hour"], maturity: 'safe' },
  { id: 'set-cottage-made-entirely-confectionery-deep', name: "A Cottage Made Entirely Of Confectionery, Deep In A Wood", category: 'fantasy', tags: ["cottage","made","entirely","confectionery"], maturity: 'safe' },
  { id: 'set-beach-season-sudden-downpour', name: "A Beach Out Of Season In A Sudden Downpour", category: 'adventure', tags: ["beach","season","sudden","downpour"], maturity: 'safe' },
  { id: 'set-saloon-where-piano-just-stopped', name: "A Saloon Where The Piano Has Just Stopped", category: 'mystery', tags: ["saloon","where","piano","just"], maturity: 'safe' },
  { id: 'set-wedding-marquee-field-sold-last', name: "A Wedding Marquee In A Field That Was Sold Last Week", category: 'sitcom', tags: ["wedding","marquee","field","sold"], maturity: 'safe' },
  { id: 'set-suburban-garage-second-freezer', name: "A Suburban Garage With A Second Freezer", category: 'crime', tags: ["suburban","garage","second","freezer"], maturity: 'mature' },
  { id: 'set-detectives-sitting-room-fog-window', name: "A Detective’s Sitting Room, Fog At The Window, Two Armchairs", category: 'mystery', tags: ["detective","sitting","room","fog"], maturity: 'safe' },
  { id: 'set-bowling-alley-broken-lane-birthday', name: "A Bowling Alley With One Broken Lane And A Birthday Party", category: 'sitcom', tags: ["bowling","alley","broken","lane"], maturity: 'safe' },
  { id: 'set-allotment-longrunning-territorial-dispute', name: "An Allotment With A Long-Running Territorial Dispute", category: 'adventure', tags: ["allotment","long-running","territorial","dispute"], maturity: 'safe' },
  { id: 'set-opera-house-box-always-kept', name: "An Opera House Box That Is Always Kept Empty", category: 'classic', tags: ["opera","house","box","always"], maturity: 'safe' },
  { id: 'set-operating-theatre-booked-off-record', name: "An Operating Theatre Booked Off The Record", category: 'crime', tags: ["operating","theatre","booked","off"], maturity: 'mature' },
  { id: 'set-roof-building-whose-door-locked', name: "The Roof Of A Building Whose Door Has Locked Behind You", category: 'adventure', tags: ["roof","building","whose","door"], maturity: 'safe' },
  { id: 'set-bathroom-where-long-time', name: "A Bathroom Where Somebody Has Been A Very Long Time", category: 'crime', tags: ["bathroom","where","long","time"], maturity: 'mature' },
  { id: 'set-cellar-light-timer', name: "A Cellar With A Light On A Timer", category: 'mystery', tags: ["cellar","light","timer"], maturity: 'safe' },
  { id: 'set-community-centre-midrefurbishment', name: "A Community Centre Mid-Refurbishment", category: 'sitcom', tags: ["community","centre","mid-refurbishment"], maturity: 'safe' },
  { id: 'set-basement-recently-laid-concrete', name: "A Basement With Recently Laid Concrete", category: 'crime', tags: ["basement","recently","laid","concrete"], maturity: 'mature' },
  { id: 'set-petrol-station-petrol-excellent-sandwiches', name: "A Petrol Station With No Petrol And Excellent Sandwiches", category: 'sitcom', tags: ["petrol","station","petrol","excellent"], maturity: 'safe' },
  { id: 'set-kitchen-where-chair-moved', name: "A Kitchen Where One Chair Has Been Moved", category: 'crime', tags: ["kitchen","where","chair","moved"], maturity: 'mature' },
  { id: 'set-warehouse-excellent-drainage', name: "A Warehouse With Excellent Drainage", category: 'crime', tags: ["warehouse","excellent","drainage"], maturity: 'mature' },
  { id: 'set-hotel-bar-where-waiting-else', name: "A Hotel Bar Where Everybody Is Waiting For Somebody Else", category: 'crime', tags: ["hotel","bar","where","waiting"], maturity: 'mature' },
  { id: 'set-betting-shop-ten-minutes-before', name: "A Betting Shop Ten Minutes Before The Off", category: 'crime', tags: ["betting","shop","ten","minutes"], maturity: 'mature' },
]

// ============================================================================
// CIRCUMSTANCES
// ============================================================================

export const CIRCUMSTANCES: ContentItem[] = [
  { id: 'circ-being-polite-wallpaper', name: "Everybody is being polite about the wallpaper", category: 'sitcom', tags: ["being","polite","wallpaper"], maturity: 'safe' },
  { id: 'circ-goodbye-taking-longer-visit', name: "A goodbye is taking longer than the visit", category: 'sitcom', tags: ["goodbye","taking","longer","visit"], maturity: 'safe' },
  { id: 'circ-go-water', name: "Somebody has to go in the water", category: 'crime', tags: ["water"], maturity: 'mature' },
  { id: 'circ-seat-car-four-people', name: "There is one seat in the car and four people", category: 'crime', tags: ["seat","car","four","people"], maturity: 'mature' },
  { id: 'circ-waiting-see-breaks-first', name: "Everybody is waiting to see who breaks first", category: 'crime', tags: ["waiting","see","breaks","first"], maturity: 'mature' },
  { id: 'circ-working-plug', name: "There is one working plug", category: 'sitcom', tags: ["working","plug"], maturity: 'safe' },
  { id: 'circ-wrong-order-arrived-much-better', name: "The wrong order has arrived and it is much better", category: 'sitcom', tags: ["wrong","order","arrived","much"], maturity: 'safe' },
  { id: 'circ-heating-turned-off-say-anything', name: "The heating cannot be turned off and nobody will say anything", category: 'sitcom', tags: ["heating","turned","off","say"], maturity: 'safe' },
  { id: 'circ-affair-discussed-third-person', name: "An affair is about to be discussed in the third person", category: 'crime', tags: ["affair","discussed","third","person"], maturity: 'mature' },
  { id: 'circ-locked-keys-inside-thing-needs', name: "Somebody has locked their keys inside the thing everybody needs", category: 'sitcom', tags: ["locked","keys","inside","thing"], maturity: 'safe' },
  { id: 'circ-told-invited-next-part', name: "Somebody must be told they are not invited to the next part", category: 'sitcom', tags: ["told","invited","next","part"], maturity: 'safe' },
  { id: 'circ-competition-prize-mentioned', name: "There is a competition and the prize has not been mentioned", category: 'sitcom', tags: ["competition","prize","mentioned"], maturity: 'safe' },
  { id: 'circ-vote-taken-lost', name: "A vote has been taken and lost by one", category: 'sitcom', tags: ["vote","taken","lost"], maturity: 'safe' },
  { id: 'circ-hostage-begun-making-suggestions', name: "A hostage has begun making suggestions", category: 'crime', tags: ["hostage","begun","making","suggestions"], maturity: 'mature' },
  { id: 'circ-fly-become-main-issue', name: "There is a fly and it has become the main issue", category: 'sitcom', tags: ["fly","become","main","issue"], maturity: 'safe' },
  { id: 'circ-all-pretending-read-same-book', name: "You are all pretending to have read the same book", category: 'sitcom', tags: ["all","pretending","read","same"], maturity: 'safe' },
  { id: 'circ-smell-burning-discussion-whose-turn', name: "There is a smell of burning and a discussion about whose turn it is", category: 'sitcom', tags: ["smell","burning","discussion","whose"], maturity: 'safe' },
  { id: 'circ-plan-depends-entirely-weather', name: "There is a plan and it depends entirely on the weather", category: 'sitcom', tags: ["plan","depends","entirely","weather"], maturity: 'safe' },
  { id: 'circ-leave-reverse-order-arrival', name: "Everybody must leave in reverse order of arrival", category: 'sitcom', tags: ["leave","reverse","order","arrival"], maturity: 'safe' },
  { id: 'circ-minor-error-being-investigated-extraordinary', name: "A minor error is being investigated at extraordinary length", category: 'sitcom', tags: ["minor","error","being","investigated"], maturity: 'safe' },
  { id: 'circ-waiting-person-already', name: "Everyone is waiting for one person who is already here", category: 'sitcom', tags: ["waiting","person","already"], maturity: 'safe' },
  { id: 'circ-money-missing-room-suspect', name: "Money is missing and everyone in the room is a suspect", category: 'crime', tags: ["money","missing","room","suspect"], maturity: 'mature' },
  { id: 'circ-being-timed-said', name: "You are being timed and nobody has said what for", category: 'sitcom', tags: ["being","timed","said"], maturity: 'safe' },
  { id: 'circ-tradition-being-observed-knows-words', name: "A tradition is being observed and nobody knows the words", category: 'sitcom', tags: ["tradition","being","observed","knows"], maturity: 'safe' },
  { id: 'circ-let-early-told', name: "Somebody has been let out early and nobody was told", category: 'crime', tags: ["let","early","told"], maturity: 'mature' },
  { id: 'circ-intervention-become-hostage-situation-degrees', name: "An intervention has become a hostage situation by degrees", category: 'crime', tags: ["intervention","become","hostage","situation"], maturity: 'mature' },
  { id: 'circ-somebodys-medication-ran-morning', name: "Somebody’s medication ran out this morning", category: 'crime', tags: ["medication","ran","morning"], maturity: 'mature' },
  { id: 'circ-recording-entire-time', name: "Somebody has been recording the entire time", category: 'crime', tags: ["recording","entire","time"], maturity: 'mature' },
  { id: 'circ-form-completed-together', name: "There is a form and it must be completed together", category: 'sitcom', tags: ["form","completed","together"], maturity: 'safe' },
  { id: 'circ-sign-hand-work', name: "Somebody has to sign it and their hand will not work", category: 'crime', tags: ["sign","hand","work"], maturity: 'mature' },
  { id: 'circ-minutes-silence-run-four', name: "A minute’s silence has run to four", category: 'sitcom', tags: ["minute","silence","run","four"], maturity: 'safe' },
  { id: 'circ-guess-changed', name: "Everybody has to guess what has changed", category: 'sitcom', tags: ["guess","changed"], maturity: 'safe' },
  { id: 'circ-told-six-weeks-told', name: "Somebody has been told they have six weeks and has told nobody", category: 'crime', tags: ["told","six","weeks","told"], maturity: 'mature' },
  { id: 'circ-confession-made-wrong-person', name: "A confession has been made to the wrong person", category: 'crime', tags: ["confession","made","wrong","person"], maturity: 'mature' },
  { id: 'circ-waiting-delivery-come', name: "Everyone is waiting for a delivery that will not come", category: 'sitcom', tags: ["waiting","delivery","come"], maturity: 'safe' },
  { id: 'circ-umbrella', name: "There is one umbrella", category: 'sitcom', tags: ["umbrella"], maturity: 'safe' },
  { id: 'circ-instructions-translated-twice-back', name: "The instructions have been translated twice and back", category: 'sitcom', tags: ["instructions","translated","twice","back"], maturity: 'safe' },
  { id: 'circ-wrong-body-delivered', name: "The wrong body has been delivered", category: 'crime', tags: ["wrong","body","delivered"], maturity: 'mature' },
  { id: 'circ-debt-come-due-room-being', name: "A debt has come due and the room is being valued", category: 'crime', tags: ["debt","come","due","room"], maturity: 'mature' },
  { id: 'circ-fire-alarm-gone-off-first', name: "The fire alarm has gone off and nobody will be the first to leave", category: 'sitcom', tags: ["fire","alarm","gone","off"], maturity: 'safe' },
  { id: 'circ-lights-go-exactly-eleven-seconds', name: "The lights go out for exactly eleven seconds at a time", category: 'sitcom', tags: ["lights","exactly","eleven","seconds"], maturity: 'safe' },
  { id: 'circ-mistaken-important-going-along', name: "Somebody has been mistaken for somebody important and is going along with it", category: 'sitcom', tags: ["mistaken","important","going","along"], maturity: 'safe' },
  { id: 'circ-deal-closed-before-sobers', name: "A deal must be closed before somebody sobers up", category: 'crime', tags: ["deal","closed","before","sobers"], maturity: 'mature' },
  { id: 'circ-body-discovered-least-suitable-person', name: "A body has been discovered by the least suitable person", category: 'crime', tags: ["body","discovered","least","suitable"], maturity: 'mature' },
  { id: 'circ-volunteer', name: "Somebody has to volunteer and nobody has", category: 'crime', tags: ["volunteer"], maturity: 'mature' },
  { id: 'circ-leaving-told-yet', name: "Somebody is leaving and has not told them yet", category: 'sitcom', tags: ["leaving","told","yet"], maturity: 'safe' },
  { id: 'circ-long-silence-become-policy', name: "A very long silence has become a policy", category: 'sitcom', tags: ["long","silence","become","policy"], maturity: 'safe' },
  { id: 'circ-smell-petrol-mentioned-matches', name: "There is a smell of petrol and nobody has mentioned matches", category: 'crime', tags: ["smell","petrol","mentioned","matches"], maturity: 'mature' },
  { id: 'circ-identified-wants-look', name: "Somebody must be identified and nobody wants to look", category: 'crime', tags: ["identified","wants","look"], maturity: 'mature' },
  { id: 'circ-speech-given-language-present-speaks', name: "A speech must be given in a language nobody present speaks", category: 'sitcom', tags: ["speech","given","language","present"], maturity: 'safe' },
  { id: 'circ-brought-own-chair', name: "Somebody has brought their own chair", category: 'sitcom', tags: ["brought","own","chair"], maturity: 'safe' },
  { id: 'circ-supposed-sold-taken', name: "What was supposed to be sold has been taken", category: 'crime', tags: ["supposed","sold","taken"], maturity: 'mature' },
  { id: 'circ-small-task-escalated-committee', name: "A very small task has been escalated to a committee", category: 'sitcom', tags: ["small","task","escalated","committee"], maturity: 'safe' },
  { id: 'circ-old-grudge-raised-worst-possible', name: "A very old grudge has been raised at the worst possible moment", category: 'sitcom', tags: ["old","grudge","raised","worst"], maturity: 'safe' },
  { id: 'circ-dispute-bill-escalated-beyond-bill', name: "A dispute about a bill has escalated beyond the bill", category: 'sitcom', tags: ["dispute","bill","escalated","beyond"], maturity: 'safe' },
  { id: 'circ-given-speech-clearly-written-different', name: "Somebody has given a speech clearly written for a different event", category: 'sitcom', tags: ["given","speech","clearly","written"], maturity: 'safe' },
  { id: 'circ-stranger-arrived-claiming-expected', name: "A stranger has arrived claiming to be expected", category: 'sitcom', tags: ["stranger","arrived","claiming","expected"], maturity: 'safe' },
  { id: 'circ-given-same-alibi-detail-differs', name: "Everyone was given the same alibi and one detail differs", category: 'crime', tags: ["given","same","alibi","detail"], maturity: 'mature' },
  { id: 'circ-read-wrong-email-loud', name: "Somebody has read the wrong email out loud", category: 'sitcom', tags: ["read","wrong","email","loud"], maturity: 'safe' },
  { id: 'circ-second-cake', name: "There is a second cake", category: 'sitcom', tags: ["second","cake"], maturity: 'safe' },
  { id: 'circ-phone-ringing-belongs-none', name: "A phone is ringing and it belongs to none of you", category: 'sitcom', tags: ["phone","ringing","belongs","none"], maturity: 'safe' },
  { id: 'circ-say-true-thing-before-leaving', name: "Everyone must say one true thing before leaving", category: 'sitcom', tags: ["say","true","thing","before"], maturity: 'safe' },
  { id: 'circ-invited-invited', name: "Somebody has invited somebody who was not to be invited", category: 'sitcom', tags: ["invited","invited"], maturity: 'safe' },
  { id: 'circ-pretending-knew', name: "Everybody is pretending they knew about this", category: 'sitcom', tags: ["pretending","knew"], maturity: 'safe' },
  { id: 'circ-being-tested-others-told', name: "One of you is being tested and the others were told", category: 'sitcom', tags: ["being","tested","others","told"], maturity: 'safe' },
  { id: 'circ-agree-song', name: "Everybody has to agree on one song", category: 'sitcom', tags: ["agree","song"], maturity: 'safe' },
  { id: 'circ-agreed-mention-smell', name: "Everybody has agreed not to mention the smell", category: 'sitcom', tags: ["agreed","mention","smell"], maturity: 'safe' },
  { id: 'circ-rehearsal-happening-person-thinks-real', name: "A rehearsal is happening and one person thinks it is real", category: 'sitcom', tags: ["rehearsal","happening","person","thinks"], maturity: 'safe' },
  { id: 'circ-remain-until-admits-something', name: "Everyone must remain until somebody admits something", category: 'sitcom', tags: ["remain","until","admits","something"], maturity: 'safe' },
  { id: 'circ-room-cleaned-before-certain-hour', name: "A room must be cleaned before a certain hour", category: 'crime', tags: ["room","cleaned","before","certain"], maturity: 'mature' },
  { id: 'circ-witness-being-persuaded', name: "A witness is being persuaded", category: 'crime', tags: ["witness","being","persuaded"], maturity: 'mature' },
  { id: 'circ-costume-required', name: "A costume is required and there is one", category: 'sitcom', tags: ["costume","required"], maturity: 'safe' },
  { id: 'circ-blackmail-payment-arrived-wrong-denominations', name: "A blackmail payment has arrived in the wrong denominations", category: 'crime', tags: ["blackmail","payment","arrived","wrong"], maturity: 'mature' },
  { id: 'circ-tell-being-decided-silence', name: "Somebody has to tell them, and it is being decided by silence", category: 'sitcom', tags: ["tell","being","decided","silence"], maturity: 'safe' },
  { id: 'circ-brought-cake-say-occasion', name: "Somebody has brought a cake and will not say what the occasion is", category: 'sitcom', tags: ["brought","cake","say","occasion"], maturity: 'safe' },
  { id: 'circ-go-back-get', name: "Somebody has to go back in and get it", category: 'sitcom', tags: ["back","get"], maturity: 'safe' },
  { id: 'circ-group-decision-made-person-present', name: "A group decision must be made about a person who is present", category: 'sitcom', tags: ["group","decision","made","person"], maturity: 'safe' },
  { id: 'circ-sitting-whole-time', name: "Somebody has been sitting there the whole time", category: 'sitcom', tags: ["sitting","whole","time"], maturity: 'safe' },
  { id: 'circ-leave-through-door-time-reasons', name: "Everyone must leave through one door, one at a time, for reasons", category: 'sitcom', tags: ["leave","through","door","time"], maturity: 'safe' },
  { id: 'circ-single-biscuit-remains', name: "A single biscuit remains", category: 'sitcom', tags: ["single","biscuit","remains"], maturity: 'safe' },
  { id: 'circ-queue-knows', name: "There is a queue and nobody knows what it is for", category: 'sitcom', tags: ["queue","knows"], maturity: 'safe' },
  { id: 'circ-performance-requested-refusal-possible', name: "A performance has been requested and refusal is not possible", category: 'sitcom', tags: ["performance","requested","refusal","possible"], maturity: 'safe' },
  { id: 'circ-confessed-something-extremely-minor-length', name: "Somebody has confessed to something extremely minor, at length", category: 'sitcom', tags: ["confessed","something","extremely","minor"], maturity: 'safe' },
  { id: 'circ-jury-being-spoken-outside-courthouse', name: "A jury is being spoken to outside a courthouse", category: 'crime', tags: ["jury","being","spoken","outside"], maturity: 'mature' },
  { id: 'circ-decision-unanimous-person-left', name: "A decision must be unanimous and one person has left", category: 'sitcom', tags: ["decision","unanimous","person","left"], maturity: 'safe' },
  { id: 'circ-pet-brought-right-pet', name: "A pet has been brought and it is not the right pet", category: 'sitcom', tags: ["pet","brought","right","pet"], maturity: 'safe' },
  { id: 'circ-being-asked-time-next-room', name: "Everybody is being asked, one at a time, in the next room", category: 'crime', tags: ["being","asked","time","next"], maturity: 'mature' },
  { id: 'circ-two-people-having-same-conversation', name: "Two people are having the same conversation about different things", category: 'sitcom', tags: ["two","people","having","same"], maturity: 'safe' },
  { id: 'circ-come-back-meant-gone', name: "Somebody has come back who was meant to be gone", category: 'crime', tags: ["come","back","meant","gone"], maturity: 'mature' },
  { id: 'circ-seating-plan-ignored', name: "The seating plan has been ignored", category: 'sitcom', tags: ["seating","plan","ignored"], maturity: 'safe' },
  { id: 'circ-being-read-worse-expected', name: "A will is being read and it is worse than expected", category: 'crime', tags: ["being","read","worse","expected"], maturity: 'mature' },
  { id: 'circ-paid-noticed', name: "Somebody has been paid to be here and it has been noticed", category: 'crime', tags: ["paid","noticed"], maturity: 'mature' },
  { id: 'circ-phone-being-looked-knows-why', name: "A phone is being looked for and everybody knows why", category: 'crime', tags: ["phone","being","looked","knows"], maturity: 'mature' },
  { id: 'circ-door-locked-outside-politely', name: "A door has been locked from the outside, politely", category: 'sitcom', tags: ["door","locked","outside","politely"], maturity: 'safe' },
  { id: 'circ-group-photograph-being-taken-move', name: "A group photograph is being taken and nobody will move", category: 'sitcom', tags: ["group","photograph","being","taken"], maturity: 'safe' },
  { id: 'circ-police-outside-knocked-yet', name: "The police are outside and have not knocked yet", category: 'crime', tags: ["police","outside","knocked","yet"], maturity: 'mature' },
  { id: 'circ-game-begun-only-some-told', name: "A game has begun and only some of you were told", category: 'sitcom', tags: ["game","begun","only","some"], maturity: 'safe' },
  { id: 'circ-rule-remember-why', name: "There is a rule and nobody can remember why", category: 'sitcom', tags: ["rule","remember","why"], maturity: 'safe' },
  { id: 'circ-lost-something-say', name: "Somebody has lost something and will not say what", category: 'sitcom', tags: ["lost","something","say"], maturity: 'safe' },
  { id: 'circ-write-same-card', name: "Everyone has to write on the same card", category: 'sitcom', tags: ["write","same","card"], maturity: 'safe' },
  { id: 'circ-relative-arrived-day-early', name: "A relative has arrived a day early", category: 'sitcom', tags: ["relative","arrived","day","early"], maturity: 'safe' },
  { id: 'circ-told-surprise-else', name: "Everyone has been told this is a surprise for somebody else", category: 'sitcom', tags: ["told","surprise","else"], maturity: 'safe' },
  { id: 'circ-gift-opened-front-person-gave', name: "A gift must be opened in front of the person who gave it", category: 'sitcom', tags: ["gift","opened","front","person"], maturity: 'safe' },
  { id: 'circ-award-given-candidates', name: "An award must be given and there are no candidates", category: 'sitcom', tags: ["award","given","candidates"], maturity: 'safe' },
  { id: 'circ-eat-polite', name: "Somebody has to eat it to be polite", category: 'sitcom', tags: ["eat","polite"], maturity: 'safe' },
  { id: 'circ-rota-drawn-immediately-violated', name: "A rota has been drawn up and immediately violated", category: 'sitcom', tags: ["rota","drawn","immediately","violated"], maturity: 'safe' },
  { id: 'circ-gun-placed-table-mistake', name: "A gun has been placed on the table by mistake", category: 'crime', tags: ["gun","placed","table","mistake"], maturity: 'mature' },
  { id: 'circ-agreed-story-offscript', name: "Everybody agreed a story and one of you is off-script", category: 'crime', tags: ["agreed","story","off-script"], maturity: 'mature' },
  { id: 'circ-chair-too-few-mention', name: "There is one chair too few and nobody will mention it", category: 'sitcom', tags: ["chair","too","few","mention"], maturity: 'safe' },
  { id: 'circ-toast-made-met', name: "A toast must be made to somebody nobody has met", category: 'sitcom', tags: ["toast","made","met"], maturity: 'safe' },
  { id: 'circ-eulogy-required-nine-minutes-liked', name: "A eulogy is required in nine minutes for somebody nobody liked", category: 'sitcom', tags: ["eulogy","required","nine","minutes"], maturity: 'safe' },
  { id: 'circ-lie-being-maintained-four-people', name: "A lie is being maintained by four people at four different speeds", category: 'crime', tags: ["lie","being","maintained","four"], maturity: 'mature' },
  { id: 'circ-given-different-set-instructions', name: "Everybody has been given a different set of instructions", category: 'sitcom', tags: ["given","different","set","instructions"], maturity: 'safe' },
  { id: 'circ-pick-side-neither-described', name: "Everybody must pick a side and neither has been described", category: 'sitcom', tags: ["pick","side","neither","described"], maturity: 'safe' },
  { id: 'circ-last-person-speak-becomes-responsible', name: "The last person to speak becomes responsible", category: 'sitcom', tags: ["last","person","speak","becomes"], maturity: 'safe' },
  { id: 'circ-threat-made-front-child', name: "A threat has been made in front of a child", category: 'crime', tags: ["threat","made","front","child"], maturity: 'mature' },
  { id: 'circ-somebodys-name-read-wrongly-corrected', name: "Somebody’s name was read out wrongly and nobody corrected it", category: 'sitcom', tags: ["name","read","wrongly","corrected"], maturity: 'safe' },
  { id: 'circ-funeral-being-planned-people-disagree', name: "A funeral is being planned by people who disagree about the cause", category: 'crime', tags: ["funeral","being","planned","people"], maturity: 'mature' },
  { id: 'circ-old-body-surfaced-tide', name: "A very old body has surfaced with the tide", category: 'crime', tags: ["old","body","surfaced","tide"], maturity: 'mature' },
  { id: 'circ-doctor-called-should', name: "A doctor has been called who should not have been", category: 'crime', tags: ["doctor","called","should"], maturity: 'mature' },
  { id: 'circ-talking-eleven-minutes-without-verb', name: "Somebody has been talking for eleven minutes without a verb", category: 'sitcom', tags: ["talking","eleven","minutes","without"], maturity: 'safe' },
  { id: 'circ-grave-dug-wrong-place', name: "A grave has been dug in the wrong place", category: 'crime', tags: ["grave","dug","wrong","place"], maturity: 'mature' },
  { id: 'circ-brought-slides', name: "Somebody has brought slides", category: 'sitcom', tags: ["brought","slides"], maturity: 'safe' },
  { id: 'circ-replaced-replacement-doing-better', name: "One of you has been replaced and the replacement is doing better", category: 'sitcom', tags: ["replaced","replacement","doing","better"], maturity: 'safe' },
  { id: 'circ-photograph-wall-changed-only-noticed', name: "The photograph on the wall has changed and only one of you has noticed", category: 'sitcom', tags: ["photograph","wall","changed","only"], maturity: 'safe' },
  { id: 'circ-told-reason', name: "Somebody has to be told that they are the reason", category: 'crime', tags: ["told","reason"], maturity: 'mature' },
  { id: 'circ-twenty-minutes-explain-decision-make', name: "You have twenty minutes to explain a decision you did not make", category: 'sitcom', tags: ["twenty","minutes","explain","decision"], maturity: 'safe' },
  { id: 'circ-queue-system-invented', name: "There is a queue system and one of you invented it", category: 'sitcom', tags: ["queue","system","invented"], maturity: 'safe' },
  { id: 'circ-leak-negotiating-whose-problem', name: "There is a leak and everybody is negotiating whose problem it is", category: 'sitcom', tags: ["leak","negotiating","whose","problem"], maturity: 'safe' },
  { id: 'circ-wrong-music-playing-loud', name: "The wrong music is playing and it is very loud", category: 'sitcom', tags: ["wrong","music","playing","loud"], maturity: 'safe' },
  { id: 'circ-room-deciding-whether-allow-just', name: "The room is deciding whether to allow what was just said", category: 'sitcom', tags: ["room","deciding","whether","allow"], maturity: 'safe' },
  { id: 'circ-heir-arrived-knew-existed', name: "An heir has arrived who nobody knew existed", category: 'crime', tags: ["heir","arrived","knew","existed"], maturity: 'mature' },
  { id: 'circ-keeps-checking-whether-having-nice', name: "Somebody keeps checking whether everybody is having a nice time", category: 'sitcom', tags: ["keeps","checking","whether","having"], maturity: 'safe' },
]

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

// Chunk 3 item 4: `getRandomContent` was DELETED here rather than repaired.
//
// It carried the biased `sort(() => Math.random() - 0.5)` idiom and had zero callers — dealing
// goes through cardCatalog.service `dealCards`, which returns catalog OPTIONS with ids, not the
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
//      silently fell through to `default`. Nobody would have noticed except by reading this.
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
