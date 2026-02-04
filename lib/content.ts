import { ContentItem } from './content-types'

// ============================================================================
// CHARACTERS
// ============================================================================

export const CHARACTERS: ContentItem[] = [
  // Sitcoms - The Office
  { id: 'char-michael-scott', name: 'Michael Scott', category: 'sitcom', tags: ['workplace', 'comedy', 'boss', 'cringe'], maturity: 'safe', source: 'The Office' },
  { id: 'char-dwight-schrute', name: 'Dwight Schrute', category: 'sitcom', tags: ['workplace', 'comedy', 'eccentric', 'farm'], maturity: 'safe', source: 'The Office' },
  { id: 'char-jim-halpert', name: 'Jim Halpert', category: 'sitcom', tags: ['workplace', 'comedy', 'prankster', 'romantic'], maturity: 'safe', source: 'The Office' },
  { id: 'char-pam-beesly', name: 'Pam Beesly', category: 'sitcom', tags: ['workplace', 'comedy', 'artist', 'romantic'], maturity: 'safe', source: 'The Office' },

  // Sitcoms - Parks and Recreation
  { id: 'char-leslie-knope', name: 'Leslie Knope', category: 'sitcom', tags: ['workplace', 'comedy', 'government', 'optimist'], maturity: 'safe', source: 'Parks and Recreation' },
  { id: 'char-ron-swanson', name: 'Ron Swanson', category: 'sitcom', tags: ['workplace', 'comedy', 'libertarian', 'woodworking'], maturity: 'safe', source: 'Parks and Recreation' },
  { id: 'char-andy-dwyer', name: 'Andy Dwyer', category: 'sitcom', tags: ['comedy', 'music', 'lovable', 'clumsy'], maturity: 'safe', source: 'Parks and Recreation' },
  { id: 'char-april-ludgate', name: 'April Ludgate', category: 'sitcom', tags: ['comedy', 'sarcastic', 'goth', 'deadpan'], maturity: 'safe', source: 'Parks and Recreation' },

  // Sitcoms - How I Met Your Mother
  { id: 'char-ted-mosby', name: 'Ted Mosby', category: 'sitcom', tags: ['comedy', 'romantic', 'architect', 'narrator'], maturity: 'safe', source: 'How I Met Your Mother' },
  { id: 'char-barney-stinson', name: 'Barney Stinson', category: 'sitcom', tags: ['comedy', 'suits', 'playboy', 'catchphrases'], maturity: 'safe', source: 'How I Met Your Mother' },
  { id: 'char-marshall-eriksen', name: 'Marshall Eriksen', category: 'sitcom', tags: ['comedy', 'lawyer', 'wholesome', 'minnesota'], maturity: 'safe', source: 'How I Met Your Mother' },
  { id: 'char-lily-aldrin', name: 'Lily Aldrin', category: 'sitcom', tags: ['comedy', 'teacher', 'art', 'matchmaker'], maturity: 'safe', source: 'How I Met Your Mother' },

  // Sitcoms - Friends
  { id: 'char-joey-tribbiani', name: 'Joey Tribbiani', category: 'sitcom', tags: ['comedy', 'actor', 'food', 'lovable'], maturity: 'safe', source: 'Friends' },
  { id: 'char-chandler-bing', name: 'Chandler Bing', category: 'sitcom', tags: ['comedy', 'sarcastic', 'awkward', 'jokes'], maturity: 'safe', source: 'Friends' },
  { id: 'char-monica-geller', name: 'Monica Geller', category: 'sitcom', tags: ['comedy', 'chef', 'competitive', 'neat-freak'], maturity: 'safe', source: 'Friends' },
  { id: 'char-ross-geller', name: 'Ross Geller', category: 'sitcom', tags: ['comedy', 'paleontology', 'divorces', 'nerdy'], maturity: 'safe', source: 'Friends' },
  { id: 'char-rachel-green', name: 'Rachel Green', category: 'sitcom', tags: ['comedy', 'fashion', 'growth', 'romantic'], maturity: 'safe', source: 'Friends' },
  { id: 'char-phoebe-buffay', name: 'Phoebe Buffay', category: 'sitcom', tags: ['comedy', 'eccentric', 'music', 'spiritual'], maturity: 'safe', source: 'Friends' },

  // Sitcoms - Big Bang Theory
  { id: 'char-sheldon-cooper', name: 'Sheldon Cooper', category: 'sitcom', tags: ['comedy', 'genius', 'physics', 'socially-awkward'], maturity: 'safe', source: 'The Big Bang Theory' },
  { id: 'char-leonard-hofstadter', name: 'Leonard Hofstadter', category: 'sitcom', tags: ['comedy', 'physics', 'nerdy', 'romantic'], maturity: 'safe', source: 'The Big Bang Theory' },
  { id: 'char-penny-tbbt', name: 'Penny', category: 'sitcom', tags: ['comedy', 'actress', 'waitress', 'midwest'], maturity: 'safe', source: 'The Big Bang Theory' },

  // Sitcoms - Other
  { id: 'char-frasier-crane', name: 'Frasier Crane', category: 'sitcom', tags: ['comedy', 'psychiatrist', 'sophisticated', 'radio'], maturity: 'safe', source: 'Frasier' },
  { id: 'char-niles-crane', name: 'Niles Crane', category: 'sitcom', tags: ['comedy', 'psychiatrist', 'refined', 'romantic'], maturity: 'safe', source: 'Frasier' },

  // Animation - SpongeBob
  { id: 'char-spongebob', name: 'SpongeBob SquarePants', category: 'animation', tags: ['cartoon', 'optimist', 'frycook', 'underwater'], maturity: 'safe', source: 'SpongeBob SquarePants' },
  { id: 'char-patrick-star', name: 'Patrick Star', category: 'animation', tags: ['cartoon', 'dim', 'starfish', 'best-friend'], maturity: 'safe', source: 'SpongeBob SquarePants' },
  { id: 'char-squidward', name: 'Squidward', category: 'animation', tags: ['cartoon', 'grumpy', 'artistic', 'neighbor'], maturity: 'safe', source: 'SpongeBob SquarePants' },

  // Animation - The Simpsons
  { id: 'char-homer-simpson', name: 'Homer Simpson', category: 'animation', tags: ['cartoon', 'dad', 'donuts', 'nuclear'], maturity: 'safe', source: 'The Simpsons' },
  { id: 'char-marge-simpson', name: 'Marge Simpson', category: 'animation', tags: ['cartoon', 'mom', 'patient', 'blue-hair'], maturity: 'safe', source: 'The Simpsons' },
  { id: 'char-bart-simpson', name: 'Bart Simpson', category: 'animation', tags: ['cartoon', 'troublemaker', 'skateboard', 'prankster'], maturity: 'safe', source: 'The Simpsons' },

  // Action Heroes - DC
  { id: 'char-batman', name: 'Batman', category: 'action', tags: ['superhero', 'vigilante', 'detective', 'dark'], maturity: 'safe', source: 'DC Comics' },
  { id: 'char-superman', name: 'Superman', category: 'action', tags: ['superhero', 'alien', 'strength', 'hope'], maturity: 'safe', source: 'DC Comics' },
  { id: 'char-wonder-woman', name: 'Wonder Woman', category: 'action', tags: ['superhero', 'amazon', 'warrior', 'justice'], maturity: 'safe', source: 'DC Comics' },

  // Action Heroes - Marvel
  { id: 'char-spider-man', name: 'Spider-Man', category: 'action', tags: ['superhero', 'teenager', 'web-slinger', 'responsibility'], maturity: 'safe', source: 'Marvel' },
  { id: 'char-iron-man', name: 'Iron Man', category: 'action', tags: ['superhero', 'genius', 'billionaire', 'tech'], maturity: 'safe', source: 'Marvel' },
  { id: 'char-captain-america', name: 'Captain America', category: 'action', tags: ['superhero', 'soldier', 'patriot', 'shield'], maturity: 'safe', source: 'Marvel' },
  { id: 'char-black-widow', name: 'Black Widow', category: 'action', tags: ['superhero', 'spy', 'assassin', 'martial-arts'], maturity: 'safe', source: 'Marvel' },
  { id: 'char-thor', name: 'Thor', category: 'action', tags: ['superhero', 'god', 'norse', 'hammer'], maturity: 'safe', source: 'Marvel' },

  // Action Heroes - Other
  { id: 'char-indiana-jones', name: 'Indiana Jones', category: 'adventure', tags: ['archaeologist', 'whip', 'adventure', 'professor'], maturity: 'safe', source: 'Indiana Jones' },
  { id: 'char-james-bond', name: 'James Bond', category: 'action', tags: ['spy', 'suave', 'gadgets', 'british'], maturity: 'safe', source: 'James Bond' },
  { id: 'char-ethan-hunt', name: 'Ethan Hunt', category: 'action', tags: ['spy', 'stunts', 'impossible', 'masks'], maturity: 'safe', source: 'Mission: Impossible' },
  { id: 'char-jack-bauer', name: 'Jack Bauer', category: 'action', tags: ['agent', 'torture', 'counter-terrorism', 'intense'], maturity: 'safe', source: '24' },
  { id: 'char-john-mcclane', name: 'John McClane', category: 'action', tags: ['cop', 'wisecracks', 'barefoot', 'everyman'], maturity: 'safe', source: 'Die Hard' },
  { id: 'char-ellen-ripley', name: 'Ellen Ripley', category: 'scifi', tags: ['survivor', 'alien-fighter', 'strong', 'space'], maturity: 'safe', source: 'Alien' },
  { id: 'char-sarah-connor', name: 'Sarah Connor', category: 'scifi', tags: ['survivor', 'mother', 'warrior', 'resistance'], maturity: 'safe', source: 'Terminator' },

  // Fantasy/Sci-Fi - Star Wars
  { id: 'char-yoda', name: 'Yoda', category: 'scifi', tags: ['jedi', 'master', 'wisdom', 'green'], maturity: 'safe', source: 'Star Wars' },
  { id: 'char-darth-vader', name: 'Darth Vader', category: 'scifi', tags: ['sith', 'villain', 'father', 'breathing'], maturity: 'safe', source: 'Star Wars' },
  { id: 'char-luke-skywalker', name: 'Luke Skywalker', category: 'scifi', tags: ['jedi', 'hero', 'chosen-one', 'farm-boy'], maturity: 'safe', source: 'Star Wars' },
  { id: 'char-princess-leia', name: 'Princess Leia', category: 'scifi', tags: ['princess', 'rebel', 'leader', 'buns'], maturity: 'safe', source: 'Star Wars' },
  { id: 'char-han-solo', name: 'Han Solo', category: 'scifi', tags: ['smuggler', 'pilot', 'scoundrel', 'charming'], maturity: 'safe', source: 'Star Wars' },
  { id: 'char-obi-wan-kenobi', name: 'Obi-Wan Kenobi', category: 'scifi', tags: ['jedi', 'mentor', 'sarcastic', 'high-ground'], maturity: 'safe', source: 'Star Wars' },
  { id: 'char-rey', name: 'Rey', category: 'scifi', tags: ['jedi', 'scavenger', 'powerful', 'hero'], maturity: 'safe', source: 'Star Wars' },
  { id: 'char-kylo-ren', name: 'Kylo Ren', category: 'scifi', tags: ['sith', 'conflicted', 'tantrum', 'mask'], maturity: 'safe', source: 'Star Wars' },

  // Fantasy/Sci-Fi - Harry Potter
  { id: 'char-hermione-granger', name: 'Hermione Granger', category: 'fantasy', tags: ['wizard', 'smart', 'brave', 'books'], maturity: 'safe', source: 'Harry Potter' },
  { id: 'char-harry-potter', name: 'Harry Potter', category: 'fantasy', tags: ['wizard', 'chosen-one', 'scar', 'brave'], maturity: 'safe', source: 'Harry Potter' },
  { id: 'char-ron-weasley', name: 'Ron Weasley', category: 'fantasy', tags: ['wizard', 'loyal', 'chess', 'ginger'], maturity: 'safe', source: 'Harry Potter' },
  { id: 'char-dumbledore', name: 'Dumbledore', category: 'fantasy', tags: ['wizard', 'headmaster', 'wise', 'beard'], maturity: 'safe', source: 'Harry Potter' },
  { id: 'char-hagrid', name: 'Hagrid', category: 'fantasy', tags: ['wizard', 'giant', 'creatures', 'kind'], maturity: 'safe', source: 'Harry Potter' },
  { id: 'char-snape', name: 'Snape', category: 'fantasy', tags: ['wizard', 'potions', 'mysterious', 'complex'], maturity: 'safe', source: 'Harry Potter' },
  { id: 'char-mcgonagall', name: 'McGonagall', category: 'fantasy', tags: ['wizard', 'professor', 'stern', 'cat'], maturity: 'safe', source: 'Harry Potter' },

  // Fantasy/Sci-Fi - Lord of the Rings
  { id: 'char-gandalf', name: 'Gandalf', category: 'fantasy', tags: ['wizard', 'wise', 'grey', 'fireworks'], maturity: 'safe', source: 'Lord of the Rings' },
  { id: 'char-frodo', name: 'Frodo', category: 'fantasy', tags: ['hobbit', 'ring-bearer', 'brave', 'small'], maturity: 'safe', source: 'Lord of the Rings' },
  { id: 'char-aragorn', name: 'Aragorn', category: 'fantasy', tags: ['ranger', 'king', 'warrior', 'noble'], maturity: 'safe', source: 'Lord of the Rings' },
  { id: 'char-legolas', name: 'Legolas', category: 'fantasy', tags: ['elf', 'archer', 'agile', 'pretty'], maturity: 'safe', source: 'Lord of the Rings' },
  { id: 'char-gimli', name: 'Gimli', category: 'fantasy', tags: ['dwarf', 'axe', 'grumpy', 'loyal'], maturity: 'safe', source: 'Lord of the Rings' },

  // Fantasy/Sci-Fi - Other
  { id: 'char-doctor-who', name: 'The Doctor (Doctor Who)', category: 'scifi', tags: ['time-lord', 'regeneration', 'tardis', 'alien'], maturity: 'safe', source: 'Doctor Who' },
  { id: 'char-marty-mcfly', name: 'Marty McFly', category: 'scifi', tags: ['time-travel', 'teenager', 'music', 'skateboard'], maturity: 'safe', source: 'Back to the Future' },
  { id: 'char-doc-brown', name: 'Doc Brown', category: 'scifi', tags: ['scientist', 'inventor', 'eccentric', 'time-travel'], maturity: 'safe', source: 'Back to the Future' },
  { id: 'char-captain-kirk', name: 'Captain Kirk', category: 'scifi', tags: ['captain', 'enterprise', 'charismatic', 'bold'], maturity: 'safe', source: 'Star Trek' },
  { id: 'char-mr-spock', name: 'Mr. Spock', category: 'scifi', tags: ['vulcan', 'logic', 'science', 'ears'], maturity: 'safe', source: 'Star Trek' },
  { id: 'char-jean-luc-picard', name: 'Jean-Luc Picard', category: 'scifi', tags: ['captain', 'diplomat', 'tea', 'shakespeare'], maturity: 'safe', source: 'Star Trek' },

  // Mystery/Detective
  { id: 'char-sherlock-holmes', name: 'Sherlock Holmes', category: 'mystery', tags: ['detective', 'genius', 'deduction', 'violin'], maturity: 'safe', source: 'Sherlock Holmes' },
  { id: 'char-watson', name: 'Watson', category: 'mystery', tags: ['doctor', 'sidekick', 'loyal', 'narrator'], maturity: 'safe', source: 'Sherlock Holmes' },
  { id: 'char-nancy-drew', name: 'Nancy Drew', category: 'mystery', tags: ['detective', 'teenage', 'sleuth', 'clever'], maturity: 'safe', source: 'Nancy Drew' },
  { id: 'char-jessica-fletcher', name: 'Jessica Fletcher', category: 'mystery', tags: ['writer', 'detective', 'small-town', 'cozy'], maturity: 'safe', source: 'Murder She Wrote' },
  { id: 'char-columbo', name: 'Columbo', category: 'mystery', tags: ['detective', 'disheveled', 'one-more-thing', 'brilliant'], maturity: 'safe', source: 'Columbo' },
  { id: 'char-monk', name: 'Monk', category: 'mystery', tags: ['detective', 'ocd', 'phobias', 'brilliant'], maturity: 'safe', source: 'Monk' },
  { id: 'char-shawn-spencer', name: 'Shawn Spencer', category: 'mystery', tags: ['fake-psychic', 'detective', 'pop-culture', 'immature'], maturity: 'safe', source: 'Psych' },
  { id: 'char-gus-psych', name: "Psych's Gus", category: 'mystery', tags: ['sidekick', 'pharmaceutical', 'scared', 'loyal'], maturity: 'safe', source: 'Psych' },
  { id: 'char-jake-peralta', name: 'Jake Peralta', category: 'sitcom', tags: ['detective', 'comedy', 'die-hard', 'immature'], maturity: 'safe', source: 'Brooklyn Nine-Nine' },
  { id: 'char-amy-santiago', name: 'Amy Santiago', category: 'sitcom', tags: ['detective', 'organized', 'competitive', 'binders'], maturity: 'safe', source: 'Brooklyn Nine-Nine' },

  // Animation - Pixar/Disney
  { id: 'char-shrek', name: 'Shrek', category: 'animation', tags: ['ogre', 'grumpy', 'swamp', 'layers'], maturity: 'safe', source: 'Shrek' },
  { id: 'char-donkey-shrek', name: 'Donkey', category: 'animation', tags: ['sidekick', 'talkative', 'loyal', 'annoying'], maturity: 'safe', source: 'Shrek' },
  { id: 'char-fiona', name: 'Fiona', category: 'animation', tags: ['princess', 'ogre', 'warrior', 'curse'], maturity: 'safe', source: 'Shrek' },
  { id: 'char-woody', name: 'Woody', category: 'animation', tags: ['toy', 'cowboy', 'leader', 'loyal'], maturity: 'safe', source: 'Toy Story' },
  { id: 'char-buzz-lightyear', name: 'Buzz Lightyear', category: 'animation', tags: ['toy', 'space-ranger', 'delusional', 'hero'], maturity: 'safe', source: 'Toy Story' },
  { id: 'char-mr-potato-head', name: 'Mr. Potato Head', category: 'animation', tags: ['toy', 'sarcastic', 'grumpy', 'parts'], maturity: 'safe', source: 'Toy Story' },
  { id: 'char-dory', name: 'Dory', category: 'animation', tags: ['fish', 'forgetful', 'optimist', 'blue'], maturity: 'safe', source: 'Finding Nemo' },
  { id: 'char-nemo', name: 'Nemo', category: 'animation', tags: ['fish', 'clownfish', 'adventurous', 'lucky-fin'], maturity: 'safe', source: 'Finding Nemo' },
  { id: 'char-marlin', name: 'Marlin', category: 'animation', tags: ['fish', 'dad', 'worried', 'protective'], maturity: 'safe', source: 'Finding Nemo' },
  { id: 'char-elsa', name: 'Elsa', category: 'animation', tags: ['princess', 'ice', 'queen', 'let-it-go'], maturity: 'safe', source: 'Frozen' },
  { id: 'char-anna', name: 'Anna', category: 'animation', tags: ['princess', 'optimist', 'clumsy', 'brave'], maturity: 'safe', source: 'Frozen' },
  { id: 'char-olaf', name: 'Olaf', category: 'animation', tags: ['snowman', 'naive', 'warm-hugs', 'summer'], maturity: 'safe', source: 'Frozen' },
  { id: 'char-kristoff', name: 'Kristoff', category: 'animation', tags: ['ice-harvester', 'reindeer', 'loner', 'kind'], maturity: 'safe', source: 'Frozen' },
  { id: 'char-simba', name: 'Simba', category: 'animation', tags: ['lion', 'prince', 'hero', 'hakuna-matata'], maturity: 'safe', source: 'The Lion King' },
  { id: 'char-timon', name: 'Timon', category: 'animation', tags: ['meerkat', 'comedian', 'sidekick', 'sarcastic'], maturity: 'safe', source: 'The Lion King' },
  { id: 'char-pumbaa', name: 'Pumbaa', category: 'animation', tags: ['warthog', 'lovable', 'sensitive', 'gas'], maturity: 'safe', source: 'The Lion King' },
  { id: 'char-rafiki', name: 'Rafiki', category: 'animation', tags: ['mandrill', 'shaman', 'wise', 'eccentric'], maturity: 'safe', source: 'The Lion King' },

  // Animation - Video Games
  { id: 'char-mario', name: 'Mario', category: 'animation', tags: ['plumber', 'hero', 'mushrooms', 'italian'], maturity: 'safe', source: 'Super Mario' },
  { id: 'char-luigi', name: 'Luigi', category: 'animation', tags: ['plumber', 'sidekick', 'scared', 'tall'], maturity: 'safe', source: 'Super Mario' },
  { id: 'char-princess-peach', name: 'Princess Peach', category: 'animation', tags: ['princess', 'kidnapped', 'pink', 'royal'], maturity: 'safe', source: 'Super Mario' },

  // Animation - Scooby-Doo
  { id: 'char-scooby-doo', name: 'Scooby-Doo', category: 'animation', tags: ['dog', 'scared', 'snacks', 'mystery'], maturity: 'safe', source: 'Scooby-Doo' },
  { id: 'char-shaggy', name: 'Shaggy', category: 'animation', tags: ['stoner', 'scared', 'food', 'beatnik'], maturity: 'safe', source: 'Scooby-Doo' },
  { id: 'char-velma', name: 'Velma', category: 'animation', tags: ['smart', 'glasses', 'jinkies', 'skeptic'], maturity: 'safe', source: 'Scooby-Doo' },
  { id: 'char-fred', name: 'Fred', category: 'animation', tags: ['leader', 'traps', 'ascot', 'mystery'], maturity: 'safe', source: 'Scooby-Doo' },
  { id: 'char-daphne', name: 'Daphne', category: 'animation', tags: ['fashionable', 'danger-prone', 'purple', 'mystery'], maturity: 'safe', source: 'Scooby-Doo' },

  // Classics
  { id: 'char-mary-poppins', name: 'Mary Poppins', category: 'classic', tags: ['nanny', 'magical', 'proper', 'umbrella'], maturity: 'safe', source: 'Mary Poppins' },
  { id: 'char-willy-wonka', name: 'Willy Wonka', category: 'classic', tags: ['chocolatier', 'eccentric', 'magical', 'factory'], maturity: 'safe', source: 'Charlie and the Chocolate Factory' },
  { id: 'char-ferris-bueller', name: 'Ferris Bueller', category: 'classic', tags: ['teenager', 'charming', 'skipper', 'fourth-wall'], maturity: 'safe', source: "Ferris Bueller's Day Off" },
  { id: 'char-elle-woods', name: 'Elle Woods', category: 'classic', tags: ['lawyer', 'blonde', 'determined', 'fashion'], maturity: 'safe', source: 'Legally Blonde' },
  { id: 'char-cher-horowitz', name: 'Cher Horowitz', category: 'classic', tags: ['valley-girl', 'fashion', 'matchmaker', '90s'], maturity: 'safe', source: 'Clueless' },
  { id: 'char-forrest-gump', name: 'Forrest Gump', category: 'classic', tags: ['simple', 'running', 'chocolate', 'history'], maturity: 'safe', source: 'Forrest Gump' },
  { id: 'char-terminator', name: 'The Terminator', category: 'scifi', tags: ['robot', 'assassin', 'catchphrase', 'arnold'], maturity: 'safe', source: 'Terminator' },
  { id: 'char-rocky-balboa', name: 'Rocky Balboa', category: 'classic', tags: ['boxer', 'underdog', 'philly', 'champion'], maturity: 'safe', source: 'Rocky' },
  { id: 'char-karate-kid', name: 'Karate Kid', category: 'classic', tags: ['martial-arts', 'underdog', 'wax-on', 'crane-kick'], maturity: 'safe', source: 'The Karate Kid' },

  // ============================================================================
  // MATURE CHARACTERS
  // ============================================================================

  // Crime/Drama - The Sopranos
  { id: 'char-tony-soprano', name: 'Tony Soprano', category: 'crime', tags: ['mob-boss', 'therapy', 'ducks', 'new-jersey'], maturity: 'mature', source: 'The Sopranos' },
  { id: 'char-christopher-moltisanti', name: 'Christopher Moltisanti', category: 'crime', tags: ['mobster', 'writer', 'addiction', 'volatile'], maturity: 'mature', source: 'The Sopranos' },
  { id: 'char-paulie-walnuts', name: 'Paulie Walnuts', category: 'crime', tags: ['mobster', 'superstitious', 'hair', 'loyal'], maturity: 'mature', source: 'The Sopranos' },
  { id: 'char-carmela-soprano', name: 'Carmela Soprano', category: 'crime', tags: ['mob-wife', 'catholic', 'conflicted', 'strong'], maturity: 'mature', source: 'The Sopranos' },

  // Crime/Drama - Breaking Bad
  { id: 'char-walter-white', name: 'Walter White', category: 'crime', tags: ['teacher', 'meth', 'cancer', 'heisenberg'], maturity: 'mature', source: 'Breaking Bad' },
  { id: 'char-jesse-pinkman', name: 'Jesse Pinkman', category: 'crime', tags: ['dealer', 'slang', 'conscience', 'yo'], maturity: 'mature', source: 'Breaking Bad' },
  { id: 'char-saul-goodman', name: 'Saul Goodman', category: 'crime', tags: ['lawyer', 'sleazy', 'schemes', 'ads'], maturity: 'mature', source: 'Breaking Bad' },
  { id: 'char-mike-ehrmantraut', name: 'Mike Ehrmantraut', category: 'crime', tags: ['fixer', 'granddaughter', 'badass', 'stoic'], maturity: 'mature', source: 'Breaking Bad' },
  { id: 'char-gus-fring', name: 'Gus Fring', category: 'crime', tags: ['kingpin', 'chicken', 'methodical', 'polite'], maturity: 'mature', source: 'Breaking Bad' },

  // Crime/Drama - Mad Men
  { id: 'char-don-draper', name: 'Don Draper', category: 'crime', tags: ['ad-man', 'mysterious', 'womanizer', 'genius'], maturity: 'mature', source: 'Mad Men' },
  { id: 'char-roger-sterling', name: 'Roger Sterling', category: 'crime', tags: ['ad-man', 'witty', 'silver-fox', 'drinking'], maturity: 'mature', source: 'Mad Men' },
  { id: 'char-peggy-olson', name: 'Peggy Olson', category: 'crime', tags: ['copywriter', 'ambitious', 'feminist', 'brooklyn'], maturity: 'mature', source: 'Mad Men' },
  { id: 'char-joan-holloway', name: 'Joan Holloway', category: 'crime', tags: ['office-manager', 'powerful', 'redhead', 'savvy'], maturity: 'mature', source: 'Mad Men' },

  // Crime/Drama - Peaky Blinders
  { id: 'char-tommy-shelby', name: 'Tommy Shelby', category: 'crime', tags: ['gangster', 'ptsd', 'caps', 'birmingham'], maturity: 'mature', source: 'Peaky Blinders' },
  { id: 'char-arthur-shelby', name: 'Arthur Shelby', category: 'crime', tags: ['gangster', 'violent', 'loyal', 'troubled'], maturity: 'mature', source: 'Peaky Blinders' },
  { id: 'char-polly-gray', name: 'Polly Gray', category: 'crime', tags: ['matriarch', 'psychic', 'fierce', 'wise'], maturity: 'mature', source: 'Peaky Blinders' },

  // Crime/Drama - Other
  { id: 'char-dexter-morgan', name: 'Dexter Morgan', category: 'crime', tags: ['serial-killer', 'forensics', 'code', 'miami'], maturity: 'mature', source: 'Dexter' },
  { id: 'char-debra-morgan', name: 'Debra Morgan', category: 'crime', tags: ['detective', 'swearing', 'tough', 'sister'], maturity: 'mature', source: 'Dexter' },
  { id: 'char-rust-cohle', name: 'Rust Cohle', category: 'crime', tags: ['detective', 'nihilist', 'philosophy', 'damaged'], maturity: 'mature', source: 'True Detective' },
  { id: 'char-marty-hart', name: 'Marty Hart', category: 'crime', tags: ['detective', 'family-man', 'hypocrite', 'partner'], maturity: 'mature', source: 'True Detective' },
  { id: 'char-omar-little', name: 'Omar Little', category: 'crime', tags: ['robber', 'code', 'shotgun', 'whistling'], maturity: 'mature', source: 'The Wire' },
  { id: 'char-jimmy-mcnulty', name: 'Jimmy McNulty', category: 'crime', tags: ['detective', 'drunk', 'obsessed', 'irish'], maturity: 'mature', source: 'The Wire' },
  { id: 'char-stringer-bell', name: 'Stringer Bell', category: 'crime', tags: ['drug-lord', 'businessman', 'educated', 'ruthless'], maturity: 'mature', source: 'The Wire' },

  // Crime/Drama - Succession
  { id: 'char-logan-roy', name: 'Logan Roy', category: 'crime', tags: ['mogul', 'tyrant', 'father', 'power'], maturity: 'mature', source: 'Succession' },
  { id: 'char-kendall-roy', name: 'Kendall Roy', category: 'crime', tags: ['heir', 'addict', 'rap', 'desperate'], maturity: 'mature', source: 'Succession' },
  { id: 'char-roman-roy', name: 'Roman Roy', category: 'crime', tags: ['youngest', 'crude', 'insecure', 'funny'], maturity: 'mature', source: 'Succession' },
  { id: 'char-shiv-roy', name: 'Shiv Roy', category: 'crime', tags: ['daughter', 'politics', 'ambitious', 'betrayal'], maturity: 'mature', source: 'Succession' },

  // Crime/Drama - House of Cards
  { id: 'char-frank-underwood', name: 'Frank Underwood', category: 'crime', tags: ['politician', 'scheming', 'fourth-wall', 'ruthless'], maturity: 'mature', source: 'House of Cards' },
  { id: 'char-claire-underwood', name: 'Claire Underwood', category: 'crime', tags: ['first-lady', 'cold', 'ambitious', 'power'], maturity: 'mature', source: 'House of Cards' },

  // Dark Comedy
  { id: 'char-deadpool', name: 'Deadpool', category: 'action', tags: ['antihero', 'fourth-wall', 'healing', 'crude'], maturity: 'mature', source: 'Marvel' },
  { id: 'char-harley-quinn', name: 'Harley Quinn', category: 'action', tags: ['villain', 'crazy', 'baseball-bat', 'accent'], maturity: 'mature', source: 'DC Comics' },
  { id: 'char-joker', name: 'The Joker', category: 'action', tags: ['villain', 'chaos', 'clown', 'psychotic'], maturity: 'mature', source: 'DC Comics' },

  // Dark Comedy - Rick and Morty
  { id: 'char-rick-sanchez', name: 'Rick Sanchez', category: 'animation', tags: ['scientist', 'drunk', 'genius', 'nihilist'], maturity: 'mature', source: 'Rick and Morty' },
  { id: 'char-morty-smith', name: 'Morty Smith', category: 'animation', tags: ['sidekick', 'anxious', 'grandson', 'average'], maturity: 'mature', source: 'Rick and Morty' },
  { id: 'char-summer-smith', name: 'Summer Smith', category: 'animation', tags: ['teenager', 'sister', 'popular', 'capable'], maturity: 'mature', source: 'Rick and Morty' },

  // Dark Comedy - Archer
  { id: 'char-sterling-archer', name: 'Sterling Archer', category: 'animation', tags: ['spy', 'narcissist', 'drunk', 'mommy-issues'], maturity: 'mature', source: 'Archer' },
  { id: 'char-lana-kane', name: 'Lana Kane', category: 'animation', tags: ['spy', 'competent', 'hands', 'ex'], maturity: 'mature', source: 'Archer' },
  { id: 'char-pam-poovey', name: 'Pam Poovey', category: 'animation', tags: ['hr', 'strong', 'crude', 'drift-racing'], maturity: 'mature', source: 'Archer' },

  // Dark Comedy - BoJack Horseman
  { id: 'char-bojack-horseman', name: 'BoJack Horseman', category: 'animation', tags: ['horse', 'actor', 'depressed', 'alcoholic'], maturity: 'mature', source: 'BoJack Horseman' },
  { id: 'char-princess-carolyn', name: 'Princess Carolyn', category: 'animation', tags: ['cat', 'agent', 'workaholic', 'tongue-twisters'], maturity: 'mature', source: 'BoJack Horseman' },
  { id: 'char-todd-chavez', name: 'Todd Chavez', category: 'animation', tags: ['slacker', 'asexual', 'schemes', 'hooray'], maturity: 'mature', source: 'BoJack Horseman' },

  // Dark Comedy - It's Always Sunny
  { id: 'char-frank-reynolds', name: 'Frank Reynolds', category: 'sitcom', tags: ['sleazy', 'rich', 'gross', 'schemes'], maturity: 'mature', source: "It's Always Sunny" },
  { id: 'char-dennis-reynolds', name: 'Dennis Reynolds', category: 'sitcom', tags: ['narcissist', 'psycho', 'golden-god', 'implication'], maturity: 'mature', source: "It's Always Sunny" },
  { id: 'char-mac-iasip', name: 'Mac', category: 'sitcom', tags: ['badass', 'catholic', 'karate', 'closeted'], maturity: 'mature', source: "It's Always Sunny" },
  { id: 'char-charlie-kelly', name: 'Charlie Kelly', category: 'sitcom', tags: ['janitor', 'illiterate', 'rats', 'stalker'], maturity: 'mature', source: "It's Always Sunny" },
  { id: 'char-dee-reynolds', name: 'Dee Reynolds', category: 'sitcom', tags: ['bird', 'actress', 'delusional', 'gangly'], maturity: 'mature', source: "It's Always Sunny" },

  // Dark Comedy - Lucifer
  { id: 'char-lucifer-morningstar', name: 'Lucifer Morningstar', category: 'fantasy', tags: ['devil', 'charming', 'desires', 'piano'], maturity: 'mature', source: 'Lucifer' },
  { id: 'char-mazikeen', name: 'Mazikeen', category: 'fantasy', tags: ['demon', 'bounty-hunter', 'fierce', 'knives'], maturity: 'mature', source: 'Lucifer' },

  // Antiheroes - The Boys
  { id: 'char-homelander', name: 'Homelander', category: 'action', tags: ['superman', 'psycho', 'milk', 'mommy-issues'], maturity: 'mature', source: 'The Boys' },
  { id: 'char-butcher', name: 'Butcher', category: 'action', tags: ['vigilante', 'british', 'revenge', 'crude'], maturity: 'mature', source: 'The Boys' },
  { id: 'char-hughie', name: 'Hughie', category: 'action', tags: ['everyman', 'nervous', 'conscience', 'music'], maturity: 'mature', source: 'The Boys' },
  { id: 'char-starlight', name: 'Starlight', category: 'action', tags: ['superhero', 'idealist', 'light', 'brave'], maturity: 'mature', source: 'The Boys' },

  // Antiheroes - Killing Eve
  { id: 'char-villanelle', name: 'Villanelle', category: 'crime', tags: ['assassin', 'psychopath', 'fashion', 'obsession'], maturity: 'mature', source: 'Killing Eve' },
  { id: 'char-eve-polastri', name: 'Eve Polastri', category: 'crime', tags: ['agent', 'obsessed', 'hair', 'mundane'], maturity: 'mature', source: 'Killing Eve' },

  // Antiheroes - Stranger Things
  { id: 'char-eleven', name: 'Eleven', category: 'scifi', tags: ['psychic', 'experiment', 'waffles', 'nosebleed'], maturity: 'mature', source: 'Stranger Things' },
  { id: 'char-hopper', name: 'Hopper', category: 'crime', tags: ['sheriff', 'dad', 'grumpy', 'protective'], maturity: 'mature', source: 'Stranger Things' },
  { id: 'char-steve-harrington', name: 'Steve Harrington', category: 'action', tags: ['babysitter', 'hair', 'bat', 'redemption'], maturity: 'mature', source: 'Stranger Things' },

  // Antiheroes - Other
  { id: 'char-john-wick', name: 'John Wick', category: 'action', tags: ['assassin', 'dog', 'pencil', 'focused'], maturity: 'mature', source: 'John Wick' },
  { id: 'char-tyler-durden', name: 'Tyler Durden', category: 'crime', tags: ['anarchist', 'soap', 'alter-ego', 'philosophy'], maturity: 'mature', source: 'Fight Club' },
  { id: 'char-patrick-bateman', name: 'Patrick Bateman', category: 'horror', tags: ['yuppie', 'psycho', 'business-cards', 'huey-lewis'], maturity: 'mature', source: 'American Psycho' },
  { id: 'char-hannibal-lecter', name: 'Hannibal Lecter', category: 'horror', tags: ['cannibal', 'psychiatrist', 'refined', 'census-taker'], maturity: 'mature', source: 'Silence of the Lambs' },
  { id: 'char-clarice-starling', name: 'Clarice Starling', category: 'crime', tags: ['fbi', 'rookie', 'lambs', 'determined'], maturity: 'mature', source: 'Silence of the Lambs' },

  // Antiheroes - Ozark
  { id: 'char-marty-byrde', name: 'Marty Byrde', category: 'crime', tags: ['accountant', 'money-laundering', 'calm', 'family'], maturity: 'mature', source: 'Ozark' },
  { id: 'char-wendy-byrde', name: 'Wendy Byrde', category: 'crime', tags: ['wife', 'ambitious', 'ruthless', 'political'], maturity: 'mature', source: 'Ozark' },

  // Duplicates removed (Tommy Shelby, Michael Corleone was never in original)
  { id: 'char-michael-corleone', name: 'Michael Corleone', category: 'crime', tags: ['godfather', 'war-hero', 'ruthless', 'family'], maturity: 'mature', source: 'The Godfather' },

  // Additional Safe Characters - Disney Classics
  { id: 'char-aladdin', name: 'Aladdin', category: 'animation', tags: ['thief', 'prince', 'magic', 'disney'], maturity: 'safe', source: 'Aladdin' },
  { id: 'char-genie', name: 'Genie', category: 'animation', tags: ['magic', 'wish', 'blue', 'funny'], maturity: 'safe', source: 'Aladdin' },
  { id: 'char-jasmine', name: 'Princess Jasmine', category: 'animation', tags: ['princess', 'independent', 'tiger', 'disney'], maturity: 'safe', source: 'Aladdin' },
  { id: 'char-mulan', name: 'Mulan', category: 'animation', tags: ['warrior', 'disguise', 'brave', 'disney'], maturity: 'safe', source: 'Mulan' },
  { id: 'char-mushu', name: 'Mushu', category: 'animation', tags: ['dragon', 'sidekick', 'small', 'funny'], maturity: 'safe', source: 'Mulan' },
  { id: 'char-tarzan', name: 'Tarzan', category: 'animation', tags: ['jungle', 'apes', 'wild', 'disney'], maturity: 'safe', source: 'Tarzan' },
  { id: 'char-pocahontas', name: 'Pocahontas', category: 'animation', tags: ['nature', 'native', 'brave', 'disney'], maturity: 'safe', source: 'Pocahontas' },
  { id: 'char-moana', name: 'Moana', category: 'animation', tags: ['ocean', 'voyage', 'brave', 'disney'], maturity: 'safe', source: 'Moana' },
  { id: 'char-maui', name: 'Maui', category: 'animation', tags: ['demigod', 'shapeshifter', 'ego', 'disney'], maturity: 'safe', source: 'Moana' },
  { id: 'char-rapunzel', name: 'Rapunzel', category: 'animation', tags: ['hair', 'tower', 'curious', 'disney'], maturity: 'safe', source: 'Tangled' },
  { id: 'char-flynn-rider', name: 'Flynn Rider', category: 'animation', tags: ['thief', 'charming', 'smolder', 'disney'], maturity: 'safe', source: 'Tangled' },
  { id: 'char-mirabel', name: 'Mirabel Madrigal', category: 'animation', tags: ['family', 'magic', 'glasses', 'disney'], maturity: 'safe', source: 'Encanto' },
  { id: 'char-bruno', name: 'Bruno Madrigal', category: 'animation', tags: ['prophecy', 'misunderstood', 'hiding', 'disney'], maturity: 'safe', source: 'Encanto' },

  // Additional Safe Characters - Pixar
  { id: 'char-mike-wazowski', name: 'Mike Wazowski', category: 'animation', tags: ['monster', 'one-eye', 'comedian', 'pixar'], maturity: 'safe', source: 'Monsters Inc.' },
  { id: 'char-sulley', name: 'Sulley', category: 'animation', tags: ['monster', 'blue', 'furry', 'pixar'], maturity: 'safe', source: 'Monsters Inc.' },
  { id: 'char-wall-e', name: 'WALL-E', category: 'animation', tags: ['robot', 'trash', 'love', 'pixar'], maturity: 'safe', source: 'WALL-E' },
  { id: 'char-eve', name: 'EVE', category: 'animation', tags: ['robot', 'sleek', 'plant', 'pixar'], maturity: 'safe', source: 'WALL-E' },
  { id: 'char-mr-incredible', name: 'Mr. Incredible', category: 'animation', tags: ['superhero', 'dad', 'strength', 'pixar'], maturity: 'safe', source: 'The Incredibles' },
  { id: 'char-elastigirl', name: 'Elastigirl', category: 'animation', tags: ['superhero', 'mom', 'stretch', 'pixar'], maturity: 'safe', source: 'The Incredibles' },
  { id: 'char-edna-mode', name: 'Edna Mode', category: 'animation', tags: ['designer', 'no-capes', 'fierce', 'pixar'], maturity: 'safe', source: 'The Incredibles' },
  { id: 'char-remy', name: 'Remy', category: 'animation', tags: ['rat', 'chef', 'paris', 'pixar'], maturity: 'safe', source: 'Ratatouille' },
  { id: 'char-lightning-mcqueen', name: 'Lightning McQueen', category: 'animation', tags: ['car', 'racer', 'arrogant', 'pixar'], maturity: 'safe', source: 'Cars' },
  { id: 'char-mater', name: 'Mater', category: 'animation', tags: ['tow-truck', 'rusty', 'friend', 'pixar'], maturity: 'safe', source: 'Cars' },
  { id: 'char-joy', name: 'Joy', category: 'animation', tags: ['emotion', 'happy', 'yellow', 'pixar'], maturity: 'safe', source: 'Inside Out' },
  { id: 'char-sadness', name: 'Sadness', category: 'animation', tags: ['emotion', 'blue', 'empathy', 'pixar'], maturity: 'safe', source: 'Inside Out' },
  { id: 'char-anger', name: 'Anger', category: 'animation', tags: ['emotion', 'red', 'fire', 'pixar'], maturity: 'safe', source: 'Inside Out' },

  // Additional Safe Characters - Dreamworks
  { id: 'char-puss-in-boots', name: 'Puss in Boots', category: 'animation', tags: ['cat', 'sword', 'spanish', 'dreamworks'], maturity: 'safe', source: 'Shrek' },
  { id: 'char-hiccup', name: 'Hiccup', category: 'animation', tags: ['viking', 'inventor', 'dragon-rider', 'dreamworks'], maturity: 'safe', source: 'How to Train Your Dragon' },
  { id: 'char-toothless', name: 'Toothless', category: 'animation', tags: ['dragon', 'night-fury', 'playful', 'dreamworks'], maturity: 'safe', source: 'How to Train Your Dragon' },
  { id: 'char-po', name: 'Po', category: 'animation', tags: ['panda', 'kung-fu', 'noodles', 'dreamworks'], maturity: 'safe', source: 'Kung Fu Panda' },
  { id: 'char-master-shifu', name: 'Master Shifu', category: 'animation', tags: ['teacher', 'martial-arts', 'small', 'dreamworks'], maturity: 'safe', source: 'Kung Fu Panda' },
  { id: 'char-alex-lion', name: 'Alex the Lion', category: 'animation', tags: ['lion', 'performer', 'zoo', 'dreamworks'], maturity: 'safe', source: 'Madagascar' },
  { id: 'char-king-julien', name: 'King Julien', category: 'animation', tags: ['lemur', 'dancing', 'ego', 'dreamworks'], maturity: 'safe', source: 'Madagascar' },

  // Additional Safe Characters - Classic Movies
  { id: 'char-dorothy-gale', name: 'Dorothy Gale', category: 'classic', tags: ['oz', 'kansas', 'ruby-slippers', 'tornado'], maturity: 'safe', source: 'The Wizard of Oz' },
  { id: 'char-glinda', name: 'Glinda the Good Witch', category: 'classic', tags: ['witch', 'pink', 'bubble', 'magic'], maturity: 'safe', source: 'The Wizard of Oz' },
  { id: 'char-scarecrow', name: 'The Scarecrow', category: 'classic', tags: ['brain', 'straw', 'dancing', 'oz'], maturity: 'safe', source: 'The Wizard of Oz' },
  { id: 'char-tin-man', name: 'The Tin Man', category: 'classic', tags: ['heart', 'metal', 'oil', 'oz'], maturity: 'safe', source: 'The Wizard of Oz' },
  { id: 'char-cowardly-lion', name: 'The Cowardly Lion', category: 'classic', tags: ['courage', 'scared', 'mane', 'oz'], maturity: 'safe', source: 'The Wizard of Oz' },
  { id: 'char-kevin-home-alone', name: 'Kevin McCallister', category: 'classic', tags: ['kid', 'traps', 'christmas', 'alone'], maturity: 'safe', source: 'Home Alone' },
  { id: 'char-edward-scissorhands', name: 'Edward Scissorhands', category: 'classic', tags: ['gothic', 'scissors', 'innocent', 'outcast'], maturity: 'safe', source: 'Edward Scissorhands' },
  { id: 'char-lt-dan', name: 'Lieutenant Dan', category: 'classic', tags: ['soldier', 'wheelchair', 'angry', 'shrimp'], maturity: 'safe', source: 'Forrest Gump' },
  { id: 'char-sam-lotr', name: 'Samwise Gamgee', category: 'fantasy', tags: ['hobbit', 'loyal', 'gardener', 'potatoes'], maturity: 'safe', source: 'Lord of the Rings' },
  { id: 'char-gollum', name: 'Gollum', category: 'fantasy', tags: ['ring', 'precious', 'split-personality', 'cave'], maturity: 'safe', source: 'Lord of the Rings' },

  // Additional Safe Characters - Modern Movies
  { id: 'char-groot', name: 'Groot', category: 'scifi', tags: ['tree', 'baby', 'three-words', 'marvel'], maturity: 'safe', source: 'Guardians of the Galaxy' },
  { id: 'char-rocket', name: 'Rocket Raccoon', category: 'scifi', tags: ['raccoon', 'weapons', 'sarcastic', 'marvel'], maturity: 'safe', source: 'Guardians of the Galaxy' },
  { id: 'char-star-lord', name: 'Star-Lord', category: 'scifi', tags: ['outlaw', 'music', 'dance', 'marvel'], maturity: 'safe', source: 'Guardians of the Galaxy' },
  { id: 'char-drax', name: 'Drax the Destroyer', category: 'scifi', tags: ['literal', 'warrior', 'invisible', 'marvel'], maturity: 'safe', source: 'Guardians of the Galaxy' },
  { id: 'char-gamora', name: 'Gamora', category: 'scifi', tags: ['assassin', 'green', 'sister', 'marvel'], maturity: 'safe', source: 'Guardians of the Galaxy' },
  { id: 'char-thanos', name: 'Thanos', category: 'scifi', tags: ['titan', 'snap', 'balance', 'marvel'], maturity: 'safe', source: 'Marvel' },
  { id: 'char-loki', name: 'Loki', category: 'fantasy', tags: ['trickster', 'brother', 'mischief', 'marvel'], maturity: 'safe', source: 'Marvel' },
  { id: 'char-hulk', name: 'The Hulk', category: 'action', tags: ['green', 'angry', 'smash', 'marvel'], maturity: 'safe', source: 'Marvel' },
  { id: 'char-black-panther', name: 'Black Panther', category: 'action', tags: ['wakanda', 'king', 'vibranium', 'marvel'], maturity: 'safe', source: 'Marvel' },
  { id: 'char-shuri', name: 'Shuri', category: 'action', tags: ['genius', 'princess', 'tech', 'marvel'], maturity: 'safe', source: 'Black Panther' },
  { id: 'char-doctor-strange', name: 'Doctor Strange', category: 'fantasy', tags: ['sorcerer', 'multiverse', 'cape', 'marvel'], maturity: 'safe', source: 'Marvel' },
  { id: 'char-ant-man', name: 'Ant-Man', category: 'action', tags: ['small', 'thief', 'ants', 'marvel'], maturity: 'safe', source: 'Marvel' },
  { id: 'char-scarlet-witch', name: 'Scarlet Witch', category: 'fantasy', tags: ['magic', 'chaos', 'powerful', 'marvel'], maturity: 'safe', source: 'Marvel' },

  // Additional Safe Characters - TV Classics
  { id: 'char-mr-bean', name: 'Mr. Bean', category: 'sitcom', tags: ['silent', 'clumsy', 'teddy', 'british'], maturity: 'safe', source: 'Mr. Bean' },
  { id: 'char-kramer', name: 'Cosmo Kramer', category: 'sitcom', tags: ['neighbor', 'schemes', 'sliding', 'hair'], maturity: 'safe', source: 'Seinfeld' },
  { id: 'char-george-costanza', name: 'George Costanza', category: 'sitcom', tags: ['neurotic', 'unemployed', 'bald', 'cheap'], maturity: 'safe', source: 'Seinfeld' },
  { id: 'char-elaine-benes', name: 'Elaine Benes', category: 'sitcom', tags: ['dancing', 'dating', 'sponge', 'editor'], maturity: 'safe', source: 'Seinfeld' },
  { id: 'char-jerry-seinfeld', name: 'Jerry Seinfeld', category: 'sitcom', tags: ['comedian', 'neat', 'cereal', 'nothing'], maturity: 'safe', source: 'Seinfeld' },
  { id: 'char-captain-holt', name: 'Captain Holt', category: 'sitcom', tags: ['stoic', 'gay', 'corgi', 'deadpan'], maturity: 'safe', source: 'Brooklyn Nine-Nine' },
  { id: 'char-rosa-diaz', name: 'Rosa Diaz', category: 'sitcom', tags: ['tough', 'scary', 'motorcycle', 'bisexual'], maturity: 'safe', source: 'Brooklyn Nine-Nine' },
  { id: 'char-charles-boyle', name: 'Charles Boyle', category: 'sitcom', tags: ['foodie', 'loyal', 'awkward', 'romantic'], maturity: 'safe', source: 'Brooklyn Nine-Nine' },
  { id: 'char-gina-linetti', name: 'Gina Linetti', category: 'sitcom', tags: ['confident', 'dancing', 'phone', 'ego'], maturity: 'safe', source: 'Brooklyn Nine-Nine' },
  { id: 'char-dwight-good-place', name: 'Jason Mendoza', category: 'sitcom', tags: ['dumb', 'jacksonville', 'dj', 'bortles'], maturity: 'safe', source: 'The Good Place' },
  { id: 'char-eleanor-shellstrop', name: 'Eleanor Shellstrop', category: 'sitcom', tags: ['selfish', 'growth', 'shrimp', 'arizona'], maturity: 'safe', source: 'The Good Place' },
  { id: 'char-tahani', name: 'Tahani Al-Jamil', category: 'sitcom', tags: ['rich', 'tall', 'name-dropper', 'british'], maturity: 'safe', source: 'The Good Place' },
  { id: 'char-chidi', name: 'Chidi Anagonye', category: 'sitcom', tags: ['ethics', 'indecisive', 'professor', 'stomachache'], maturity: 'safe', source: 'The Good Place' },
  { id: 'char-michael-good-place', name: 'Michael (The Good Place)', category: 'sitcom', tags: ['demon', 'architect', 'reformed', 'bow-tie'], maturity: 'safe', source: 'The Good Place' },
  { id: 'char-ted-lasso', name: 'Ted Lasso', category: 'sitcom', tags: ['coach', 'optimist', 'biscuits', 'mustache'], maturity: 'safe', source: 'Ted Lasso' },
  { id: 'char-roy-kent', name: 'Roy Kent', category: 'sitcom', tags: ['footballer', 'grumpy', 'legend', 'cursing'], maturity: 'safe', source: 'Ted Lasso' },
  { id: 'char-rebecca-welton', name: 'Rebecca Welton', category: 'sitcom', tags: ['boss', 'owner', 'divorce', 'powerful'], maturity: 'safe', source: 'Ted Lasso' },
]

// ============================================================================
// SETTINGS
// ============================================================================

export const SETTINGS: ContentItem[] = [
  // Sitcom Locations
  { id: 'set-central-perk', name: 'Central Perk (Friends)', category: 'sitcom', tags: ['coffee-shop', 'couch', 'nyc'], maturity: 'safe', source: 'Friends' },
  { id: 'set-office-conference', name: 'The Office Conference Room (The Office)', category: 'sitcom', tags: ['workplace', 'meetings', 'scranton'], maturity: 'safe', source: 'The Office' },
  { id: 'set-maclarens', name: "MacLaren's Pub (How I Met Your Mother)", category: 'sitcom', tags: ['bar', 'booth', 'nyc'], maturity: 'safe', source: 'How I Met Your Mother' },
  { id: 'set-pawnee-city-hall', name: 'Pawnee City Hall (Parks and Rec)', category: 'sitcom', tags: ['government', 'small-town', 'indiana'], maturity: 'safe', source: 'Parks and Recreation' },
  { id: 'set-apartment-4a', name: 'Apartment 4A (The Big Bang Theory)', category: 'sitcom', tags: ['apartment', 'nerdy', 'pasadena'], maturity: 'safe', source: 'The Big Bang Theory' },
  { id: 'set-krusty-krab', name: 'The Krusty Krab (SpongeBob)', category: 'animation', tags: ['restaurant', 'underwater', 'fast-food'], maturity: 'safe', source: 'SpongeBob SquarePants' },
  { id: 'set-cheers-bar', name: 'Cheers Bar (Cheers)', category: 'sitcom', tags: ['bar', 'boston', 'everybody-knows'], maturity: 'safe', source: 'Cheers' },
  { id: 'set-simpsons-living-room', name: 'The Simpsons Living Room', category: 'animation', tags: ['home', 'couch', 'springfield'], maturity: 'safe', source: 'The Simpsons' },
  { id: 'set-frasier-apartment', name: "Frasier's Apartment", category: 'sitcom', tags: ['apartment', 'seattle', 'sophisticated'], maturity: 'safe', source: 'Frasier' },
  { id: 'set-seinfeld-apartment', name: "Seinfeld's Apartment", category: 'sitcom', tags: ['apartment', 'nyc', 'nothing'], maturity: 'safe', source: 'Seinfeld' },
  { id: 'set-brooklyn-99-precinct', name: 'The Brooklyn Nine-Nine Precinct', category: 'sitcom', tags: ['police', 'brooklyn', 'bullpen'], maturity: 'safe', source: 'Brooklyn Nine-Nine' },

  // Fantasy/Sci-Fi - Superhero
  { id: 'set-batcave', name: 'The Batcave (Batman)', category: 'action', tags: ['secret', 'tech', 'dark'], maturity: 'safe', source: 'Batman' },
  { id: 'set-stark-tower', name: 'Stark Tower (Marvel)', category: 'action', tags: ['skyscraper', 'tech', 'nyc'], maturity: 'safe', source: 'Marvel' },

  // Fantasy/Sci-Fi - Doctor Who
  { id: 'set-tardis', name: 'The TARDIS (Doctor Who)', category: 'scifi', tags: ['time-machine', 'bigger-inside', 'police-box'], maturity: 'safe', source: 'Doctor Who' },

  // Fantasy/Sci-Fi - Star Wars
  { id: 'set-death-star', name: 'The Death Star (Star Wars)', category: 'scifi', tags: ['space-station', 'empire', 'moon'], maturity: 'safe', source: 'Star Wars' },
  { id: 'set-millennium-falcon', name: 'The Millennium Falcon (Star Wars)', category: 'scifi', tags: ['spaceship', 'smuggler', 'fast'], maturity: 'safe', source: 'Star Wars' },
  { id: 'set-mos-eisley', name: 'Mos Eisley Cantina (Star Wars)', category: 'scifi', tags: ['bar', 'aliens', 'tatooine'], maturity: 'safe', source: 'Star Wars' },
  { id: 'set-jabbas-palace', name: "Jabba's Palace (Star Wars)", category: 'scifi', tags: ['palace', 'crime-lord', 'tatooine'], maturity: 'safe', source: 'Star Wars' },

  // Fantasy/Sci-Fi - Harry Potter
  { id: 'set-hogwarts-great-hall', name: 'Hogwarts Great Hall (Harry Potter)', category: 'fantasy', tags: ['school', 'magic', 'feasts'], maturity: 'safe', source: 'Harry Potter' },
  { id: 'set-the-burrow', name: 'The Burrow (Harry Potter)', category: 'fantasy', tags: ['home', 'weasley', 'cozy'], maturity: 'safe', source: 'Harry Potter' },
  { id: 'set-diagon-alley', name: 'Diagon Alley (Harry Potter)', category: 'fantasy', tags: ['shopping', 'magic', 'hidden'], maturity: 'safe', source: 'Harry Potter' },
  { id: 'set-hogsmeade', name: 'Hogsmeade (Harry Potter)', category: 'fantasy', tags: ['village', 'magic', 'butterbeer'], maturity: 'safe', source: 'Harry Potter' },

  // Fantasy/Sci-Fi - Lord of the Rings
  { id: 'set-the-shire', name: 'The Shire (Lord of the Rings)', category: 'fantasy', tags: ['hobbit', 'peaceful', 'green'], maturity: 'safe', source: 'Lord of the Rings' },
  { id: 'set-rivendell', name: 'Rivendell (Lord of the Rings)', category: 'fantasy', tags: ['elves', 'beautiful', 'refuge'], maturity: 'safe', source: 'Lord of the Rings' },
  { id: 'set-minas-tirith', name: 'Minas Tirith (Lord of the Rings)', category: 'fantasy', tags: ['city', 'white', 'gondor'], maturity: 'safe', source: 'Lord of the Rings' },

  // Fantasy/Sci-Fi - Other
  { id: 'set-hill-valley-clock-tower', name: 'Hill Valley Clock Tower (Back to the Future)', category: 'scifi', tags: ['town-square', 'lightning', 'iconic'], maturity: 'safe', source: 'Back to the Future' },
  { id: 'set-enterprise-bridge', name: 'The Enterprise Bridge (Star Trek)', category: 'scifi', tags: ['spaceship', 'command', 'exploration'], maturity: 'safe', source: 'Star Trek' },
  { id: 'set-starfleet-academy', name: 'Starfleet Academy (Star Trek)', category: 'scifi', tags: ['school', 'space', 'training'], maturity: 'safe', source: 'Star Trek' },

  // Action/Adventure
  { id: 'set-daily-planet', name: 'The Daily Planet (Superman)', category: 'action', tags: ['newspaper', 'metropolis', 'globe'], maturity: 'safe', source: 'Superman' },
  { id: 'set-mi6-hq', name: 'MI6 Headquarters (James Bond)', category: 'action', tags: ['spy', 'london', 'secret'], maturity: 'safe', source: 'James Bond' },
  { id: 'set-jurassic-park-visitor', name: 'Jurassic Park Visitor Center', category: 'adventure', tags: ['dinosaurs', 'island', 'chaos'], maturity: 'safe', source: 'Jurassic Park' },
  { id: 'set-nakatomi-plaza', name: 'Nakatomi Plaza (Die Hard)', category: 'action', tags: ['skyscraper', 'christmas', 'la'], maturity: 'safe', source: 'Die Hard' },
  { id: 'set-ctu-hq', name: 'CTU Headquarters (24)', category: 'action', tags: ['counter-terrorism', 'urgent', 'tech'], maturity: 'safe', source: '24' },
  { id: 'set-ghostbusters-hq', name: 'Ghostbusters HQ', category: 'action', tags: ['firehouse', 'ghosts', 'nyc'], maturity: 'safe', source: 'Ghostbusters' },
  { id: 'set-mib-hq', name: 'Men in Black Headquarters', category: 'scifi', tags: ['secret', 'aliens', 'underground'], maturity: 'safe', source: 'Men in Black' },

  // Mystery
  { id: 'set-221b-baker-street', name: '221B Baker Street (Sherlock)', category: 'mystery', tags: ['apartment', 'london', 'detective'], maturity: 'safe', source: 'Sherlock Holmes' },
  { id: 'set-murder-she-wrote-house', name: 'The Murder She Wrote House', category: 'mystery', tags: ['home', 'maine', 'cozy'], maturity: 'safe', source: 'Murder She Wrote' },
  { id: 'set-psych-office', name: 'The Psych Office', category: 'mystery', tags: ['detective', 'fake-psychic', 'santa-barbara'], maturity: 'safe', source: 'Psych' },

  // Animation
  { id: 'set-andys-room', name: "Andy's Room (Toy Story)", category: 'animation', tags: ['bedroom', 'toys', 'childhood'], maturity: 'safe', source: 'Toy Story' },
  { id: 'set-monsters-inc-factory', name: 'Monsters Inc. Factory Floor', category: 'animation', tags: ['factory', 'monsters', 'doors'], maturity: 'safe', source: 'Monsters Inc.' },
  { id: 'set-incredibles-house', name: 'The Incredibles House', category: 'animation', tags: ['suburban', 'superhero', 'secret'], maturity: 'safe', source: 'The Incredibles' },
  { id: 'set-shreks-swamp', name: "Shrek's Swamp", category: 'animation', tags: ['swamp', 'home', 'ogre'], maturity: 'safe', source: 'Shrek' },
  { id: 'set-arendelle-castle', name: 'Arendelle Castle (Frozen)', category: 'animation', tags: ['castle', 'ice', 'norway'], maturity: 'safe', source: 'Frozen' },
  { id: 'set-pride-rock', name: 'Pride Rock (The Lion King)', category: 'animation', tags: ['savanna', 'kingdom', 'iconic'], maturity: 'safe', source: 'The Lion King' },
  { id: 'set-hundred-acre-wood', name: 'Hundred Acre Wood (Winnie the Pooh)', category: 'animation', tags: ['forest', 'cozy', 'childhood'], maturity: 'safe', source: 'Winnie the Pooh' },
  { id: 'set-springfield-nuclear', name: 'Springfield Nuclear Plant', category: 'animation', tags: ['workplace', 'nuclear', 'dangerous'], maturity: 'safe', source: 'The Simpsons' },

  // Classics
  { id: 'set-overlook-hotel', name: 'The Overlook Hotel Lobby (The Shining)', category: 'horror', tags: ['hotel', 'haunted', 'isolated'], maturity: 'safe', source: 'The Shining' },
  { id: 'set-wonka-factory', name: "Willy Wonka's Chocolate Factory", category: 'classic', tags: ['factory', 'candy', 'magical'], maturity: 'safe', source: 'Charlie and the Chocolate Factory' },
  { id: 'set-ferris-bedroom', name: "Ferris Bueller's Bedroom", category: 'classic', tags: ['bedroom', 'teenager', 'elaborate'], maturity: 'safe', source: "Ferris Bueller's Day Off" },
  { id: 'set-wayne-manor', name: 'Wayne Manor (Batman)', category: 'action', tags: ['mansion', 'gothic', 'secret'], maturity: 'safe', source: 'Batman' },
  { id: 'set-sesame-street', name: 'Sesame Street', category: 'animation', tags: ['street', 'educational', 'friendly'], maturity: 'safe', source: 'Sesame Street' },
  { id: 'set-rocky-steps', name: 'The Rocky Steps (Philadelphia)', category: 'classic', tags: ['steps', 'training', 'iconic'], maturity: 'safe', source: 'Rocky' },

  // ============================================================================
  // MATURE SETTINGS
  // ============================================================================

  // Crime/Drama - The Sopranos
  { id: 'set-bada-bing', name: 'The Bada Bing! (The Sopranos)', category: 'crime', tags: ['strip-club', 'mob', 'meetings'], maturity: 'mature', source: 'The Sopranos' },
  { id: 'set-satriales', name: "Satriale's Pork Store (The Sopranos)", category: 'crime', tags: ['deli', 'mob', 'backroom'], maturity: 'mature', source: 'The Sopranos' },

  // Crime/Drama - Breaking Bad
  { id: 'set-los-pollos-hermanos', name: 'Los Pollos Hermanos (Breaking Bad)', category: 'crime', tags: ['restaurant', 'front', 'chicken'], maturity: 'mature', source: 'Breaking Bad' },
  { id: 'set-superlab', name: 'The Superlab (Breaking Bad)', category: 'crime', tags: ['meth-lab', 'industrial', 'secret'], maturity: 'mature', source: 'Breaking Bad' },
  { id: 'set-breaking-bad-desert', name: 'The Desert (Breaking Bad)', category: 'crime', tags: ['desert', 'isolation', 'new-mexico'], maturity: 'mature', source: 'Breaking Bad' },

  // Crime/Drama - Other
  { id: 'set-sterling-cooper', name: 'Sterling Cooper Office (Mad Men)', category: 'crime', tags: ['office', '60s', 'advertising'], maturity: 'mature', source: 'Mad Men' },
  { id: 'set-garrison-pub', name: 'The Garrison Pub (Peaky Blinders)', category: 'crime', tags: ['pub', 'birmingham', 'gang'], maturity: 'mature', source: 'Peaky Blinders' },
  { id: 'set-shelby-company', name: 'Shelby Company Ltd (Peaky Blinders)', category: 'crime', tags: ['office', 'legitimate', 'front'], maturity: 'mature', source: 'Peaky Blinders' },
  { id: 'set-dexter-kill-room', name: "Dexter's Kill Room", category: 'crime', tags: ['plastic', 'ritual', 'isolated'], maturity: 'mature', source: 'Dexter' },
  { id: 'set-wire-baltimore', name: "The Wire's Baltimore Streets", category: 'crime', tags: ['urban', 'drug-corners', 'decay'], maturity: 'mature', source: 'The Wire' },
  { id: 'set-hamsterdam', name: 'Hamsterdam (The Wire)', category: 'crime', tags: ['free-zone', 'drugs', 'experiment'], maturity: 'mature', source: 'The Wire' },
  { id: 'set-byrde-ozark-house', name: 'The Byrde Family Ozark House', category: 'crime', tags: ['lakehouse', 'missouri', 'money'], maturity: 'mature', source: 'Ozark' },

  // Dark Comedy
  { id: 'set-paddys-pub', name: "Paddy's Pub (It's Always Sunny)", category: 'sitcom', tags: ['bar', 'philly', 'dive'], maturity: 'mature', source: "It's Always Sunny" },
  { id: 'set-ricks-garage', name: "Rick's Garage (Rick and Morty)", category: 'animation', tags: ['garage', 'lab', 'portal'], maturity: 'mature', source: 'Rick and Morty' },
  { id: 'set-citadel', name: 'The Citadel (Rick and Morty)', category: 'animation', tags: ['ricks', 'mortys', 'dimension'], maturity: 'mature', source: 'Rick and Morty' },
  { id: 'set-planet-express', name: 'The Planet Express Ship (Futurama)', category: 'animation', tags: ['spaceship', 'delivery', 'future'], maturity: 'mature', source: 'Futurama' },
  { id: 'set-archer-isis', name: "Archer's ISIS Office", category: 'animation', tags: ['spy', 'office', 'dysfunctional'], maturity: 'mature', source: 'Archer' },
  { id: 'set-bojack-house', name: "BoJack's Hollywood House", category: 'animation', tags: ['mansion', 'hollywood', 'pool'], maturity: 'mature', source: 'BoJack Horseman' },
  { id: 'set-lux-nightclub', name: 'Lux Nightclub (Lucifer)', category: 'fantasy', tags: ['nightclub', 'la', 'devil'], maturity: 'mature', source: 'Lucifer' },

  // Thriller/Horror
  { id: 'set-red-room-twin-peaks', name: 'The Red Room (Twin Peaks)', category: 'horror', tags: ['surreal', 'lodge', 'curtains'], maturity: 'mature', source: 'Twin Peaks' },
  { id: 'set-black-lodge', name: 'The Black Lodge (Twin Peaks)', category: 'horror', tags: ['supernatural', 'chevron', 'backwards'], maturity: 'mature', source: 'Twin Peaks' },
  { id: 'set-hannibal-dining', name: "Hannibal's Dining Room", category: 'horror', tags: ['elegant', 'dinner', 'cannibalism'], maturity: 'mature', source: 'Hannibal' },
  { id: 'set-upside-down', name: 'The Upside Down (Stranger Things)', category: 'horror', tags: ['alternate', 'dark', 'spores'], maturity: 'mature', source: 'Stranger Things' },
  { id: 'set-hawkins-lab', name: 'Hawkins Lab (Stranger Things)', category: 'scifi', tags: ['lab', 'experiments', 'government'], maturity: 'mature', source: 'Stranger Things' },
  { id: 'set-continental-hotel', name: 'The Continental Hotel (John Wick)', category: 'action', tags: ['hotel', 'assassins', 'rules'], maturity: 'mature', source: 'John Wick' },
  { id: 'set-fight-club-basement', name: "Fight Club's Basement", category: 'crime', tags: ['basement', 'bare-knuckle', 'secret'], maturity: 'mature', source: 'Fight Club' },

  // Prestige Drama
  { id: 'set-vought-tower', name: 'Vought Tower (The Boys)', category: 'action', tags: ['corporate', 'superhero', 'corrupt'], maturity: 'mature', source: 'The Boys' },
  { id: 'set-seven-conference', name: "The Seven's Conference Room (The Boys)", category: 'action', tags: ['meeting', 'superhero', 'tense'], maturity: 'mature', source: 'The Boys' },
  { id: 'set-villanelle-apartment', name: "Villanelle's Apartment (Killing Eve)", category: 'crime', tags: ['apartment', 'paris', 'designer'], maturity: 'mature', source: 'Killing Eve' },
  { id: 'set-dutton-ranch', name: 'The Dutton Ranch (Yellowstone)', category: 'crime', tags: ['ranch', 'montana', 'sprawling'], maturity: 'mature', source: 'Yellowstone' },
  { id: 'set-waystar-boardroom', name: "Succession's Waystar Royco Boardroom", category: 'crime', tags: ['boardroom', 'corporate', 'power'], maturity: 'mature', source: 'Succession' },
  { id: 'set-oval-office-hoc', name: 'The Oval Office (House of Cards)', category: 'crime', tags: ['oval-office', 'politics', 'power'], maturity: 'mature', source: 'House of Cards' },

  // Additional Safe Settings - Disney/Pixar Locations
  { id: 'set-agrabah-palace', name: 'Agrabah Palace (Aladdin)', category: 'animation', tags: ['palace', 'arabian', 'magic'], maturity: 'safe', source: 'Aladdin' },
  { id: 'set-cave-of-wonders', name: 'Cave of Wonders (Aladdin)', category: 'animation', tags: ['cave', 'treasure', 'tiger'], maturity: 'safe', source: 'Aladdin' },
  { id: 'set-belles-village', name: "Belle's Village (Beauty and the Beast)", category: 'animation', tags: ['village', 'french', 'provincial'], maturity: 'safe', source: 'Beauty and the Beast' },
  { id: 'set-beast-castle', name: "The Beast's Castle (Beauty and the Beast)", category: 'animation', tags: ['castle', 'enchanted', 'gothic'], maturity: 'safe', source: 'Beauty and the Beast' },
  { id: 'set-under-the-sea', name: 'Under the Sea (The Little Mermaid)', category: 'animation', tags: ['ocean', 'mermaids', 'music'], maturity: 'safe', source: 'The Little Mermaid' },
  { id: 'set-neverland', name: 'Neverland (Peter Pan)', category: 'animation', tags: ['island', 'pirates', 'fairies'], maturity: 'safe', source: 'Peter Pan' },
  { id: 'set-wonderland', name: 'Wonderland (Alice in Wonderland)', category: 'animation', tags: ['surreal', 'tea-party', 'rabbit-hole'], maturity: 'safe', source: 'Alice in Wonderland' },
  { id: 'set-monsters-inc-door', name: 'Monsters Inc. Scare Floor', category: 'animation', tags: ['factory', 'doors', 'monsters'], maturity: 'safe', source: 'Monsters Inc.' },
  { id: 'set-axiom', name: 'The Axiom Spaceship (WALL-E)', category: 'animation', tags: ['spaceship', 'future', 'obesity'], maturity: 'safe', source: 'WALL-E' },
  { id: 'set-gusteau-restaurant', name: "Gusteau's Restaurant (Ratatouille)", category: 'animation', tags: ['restaurant', 'paris', 'kitchen'], maturity: 'safe', source: 'Ratatouille' },
  { id: 'set-radiator-springs', name: 'Radiator Springs (Cars)', category: 'animation', tags: ['town', 'route-66', 'desert'], maturity: 'safe', source: 'Cars' },
  { id: 'set-rileys-mind', name: "Riley's Mind Headquarters (Inside Out)", category: 'animation', tags: ['mind', 'emotions', 'colorful'], maturity: 'safe', source: 'Inside Out' },
  { id: 'set-soul-great-before', name: 'The Great Before (Soul)', category: 'animation', tags: ['afterlife', 'souls', 'mentors'], maturity: 'safe', source: 'Soul' },
  { id: 'set-coco-land-dead', name: 'Land of the Dead (Coco)', category: 'animation', tags: ['afterlife', 'mexican', 'skeletons'], maturity: 'safe', source: 'Coco' },
  { id: 'set-encanto-casita', name: 'Casita (Encanto)', category: 'animation', tags: ['house', 'magical', 'colombian'], maturity: 'safe', source: 'Encanto' },

  // Additional Safe Settings - Classic/Fantasy Locations
  { id: 'set-emerald-city', name: 'The Emerald City (Wizard of Oz)', category: 'classic', tags: ['city', 'green', 'magic'], maturity: 'safe', source: 'The Wizard of Oz' },
  { id: 'set-oz-yellow-brick', name: 'Yellow Brick Road (Wizard of Oz)', category: 'classic', tags: ['road', 'journey', 'colorful'], maturity: 'safe', source: 'The Wizard of Oz' },
  { id: 'set-narnia-wardrobe', name: 'Wardrobe to Narnia', category: 'fantasy', tags: ['wardrobe', 'portal', 'snow'], maturity: 'safe', source: 'Narnia' },
  { id: 'set-narnia-lamp-post', name: 'Lamp Post in Narnia', category: 'fantasy', tags: ['lamp', 'forest', 'winter'], maturity: 'safe', source: 'Narnia' },
  { id: 'set-bag-end', name: 'Bag End (Lord of the Rings)', category: 'fantasy', tags: ['hobbit-hole', 'cozy', 'door'], maturity: 'safe', source: 'Lord of the Rings' },
  { id: 'set-mordor', name: 'Mordor (Lord of the Rings)', category: 'fantasy', tags: ['volcano', 'dark', 'evil'], maturity: 'safe', source: 'Lord of the Rings' },
  { id: 'set-helm-deep', name: "Helm's Deep (Lord of the Rings)", category: 'fantasy', tags: ['fortress', 'battle', 'siege'], maturity: 'safe', source: 'Lord of the Rings' },

  // Additional Safe Settings - Modern/Adventure
  { id: 'set-kevin-house', name: "Kevin's House (Home Alone)", category: 'classic', tags: ['house', 'traps', 'christmas'], maturity: 'safe', source: 'Home Alone' },
  { id: 'set-mcallister-house', name: 'McCallister House Exterior', category: 'classic', tags: ['suburban', 'snow', 'mansion'], maturity: 'safe', source: 'Home Alone' },
  { id: 'set-gotham-streets', name: 'Gotham City Streets', category: 'action', tags: ['city', 'dark', 'crime'], maturity: 'safe', source: 'Batman' },
  { id: 'set-wakanda', name: 'Wakanda', category: 'action', tags: ['hidden', 'advanced', 'african'], maturity: 'safe', source: 'Black Panther' },
  { id: 'set-knowhere', name: 'Knowhere (Guardians)', category: 'scifi', tags: ['head', 'space', 'mining'], maturity: 'safe', source: 'Guardians of the Galaxy' },
  { id: 'set-milano', name: 'The Milano (Guardians)', category: 'scifi', tags: ['spaceship', 'music', 'team'], maturity: 'safe', source: 'Guardians of the Galaxy' },
  { id: 'set-sanctum-sanctorum', name: 'Sanctum Sanctorum', category: 'fantasy', tags: ['magic', 'nyc', 'library'], maturity: 'safe', source: 'Doctor Strange' },
  { id: 'set-asgard', name: 'Asgard', category: 'fantasy', tags: ['realm', 'gods', 'rainbow-bridge'], maturity: 'safe', source: 'Thor' },
  { id: 'set-sakaar', name: 'Sakaar Arena', category: 'scifi', tags: ['gladiator', 'trash', 'grandmaster'], maturity: 'safe', source: 'Thor: Ragnarok' },

  // Additional Safe Settings - TV Locations
  { id: 'set-good-place', name: 'The Good Place Neighborhood', category: 'sitcom', tags: ['afterlife', 'perfect', 'frozen-yogurt'], maturity: 'safe', source: 'The Good Place' },
  { id: 'set-bad-place', name: 'The Bad Place', category: 'sitcom', tags: ['hell', 'demons', 'chaos'], maturity: 'safe', source: 'The Good Place' },
  { id: 'set-afc-richmond', name: 'AFC Richmond Locker Room', category: 'sitcom', tags: ['football', 'locker', 'team'], maturity: 'safe', source: 'Ted Lasso' },
  { id: 'set-crown-anchor', name: 'The Crown & Anchor Pub', category: 'sitcom', tags: ['pub', 'english', 'football'], maturity: 'safe', source: 'Ted Lasso' },
  { id: 'set-dunder-mifflin-kitchen', name: 'Dunder Mifflin Kitchen', category: 'sitcom', tags: ['office', 'break-room', 'microwave'], maturity: 'safe', source: 'The Office' },
  { id: 'set-schrute-farms', name: 'Schrute Farms', category: 'sitcom', tags: ['farm', 'beets', 'agritourism'], maturity: 'safe', source: 'The Office' },
  { id: 'set-jjs-diner', name: "JJ's Diner (Parks and Rec)", category: 'sitcom', tags: ['diner', 'waffles', 'pawnee'], maturity: 'safe', source: 'Parks and Recreation' },
  { id: 'set-mouse-rat-concert', name: 'Mouse Rat Concert Stage', category: 'sitcom', tags: ['stage', 'rock', 'pawnee'], maturity: 'safe', source: 'Parks and Recreation' },
]

// ============================================================================
// CIRCUMSTANCES
// ============================================================================

export const CIRCUMSTANCES: ContentItem[] = [
  // Social Mishaps
  { id: 'circ-drivers-ed', name: 'Teaching a driver\'s ed class', category: 'workplace', tags: ['teaching', 'cars', 'patience'], maturity: 'safe' },
  { id: 'circ-soup-return', name: 'Trying to return a soup at a deli', category: 'sitcom', tags: ['customer-service', 'absurd', 'confrontation'], maturity: 'safe' },
  { id: 'circ-elevator-stuck', name: 'Stuck in an elevator with strangers', category: 'sitcom', tags: ['confined', 'awkward', 'strangers'], maturity: 'safe' },
  { id: 'circ-dinner-party', name: 'Hosting a chaotic dinner party', category: 'sitcom', tags: ['party', 'disaster', 'social'], maturity: 'safe' },
  { id: 'circ-ikea-furniture', name: 'Attempting to assemble IKEA furniture', category: 'sitcom', tags: ['frustration', 'instructions', 'domestic'], maturity: 'safe' },
  { id: 'circ-wedding-planner', name: 'Dealing with a wedding planner disaster', category: 'romance', tags: ['wedding', 'stress', 'planning'], maturity: 'safe' },
  { id: 'circ-12-cats', name: 'Accidentally adopting 12 cats', category: 'sitcom', tags: ['pets', 'overwhelming', 'absurd'], maturity: 'safe' },
  { id: 'circ-parallel-park', name: 'Learning to parallel park in a busy city', category: 'sitcom', tags: ['driving', 'stress', 'city'], maturity: 'safe' },
  { id: 'circ-impress-inlaws', name: 'Trying to impress future in-laws', category: 'romance', tags: ['family', 'nervous', 'approval'], maturity: 'safe' },
  { id: 'circ-team-building', name: 'Attending a corporate team-building retreat', category: 'workplace', tags: ['corporate', 'awkward', 'forced-fun'], maturity: 'safe' },
  { id: 'circ-surprise-party', name: 'Organizing a surprise birthday party', category: 'sitcom', tags: ['party', 'secrets', 'planning'], maturity: 'safe' },
  { id: 'circ-lost-airport', name: 'Lost at an airport during a layover', category: 'adventure', tags: ['travel', 'confusion', 'time-pressure'], maturity: 'safe' },

  // Work Scenarios
  { id: 'circ-unprepared-report', name: "Presenting a report you didn't prepare", category: 'workplace', tags: ['work', 'panic', 'improvise'], maturity: 'safe' },
  { id: 'circ-terrible-trainee', name: "Training a new employee who's terrible", category: 'workplace', tags: ['work', 'patience', 'incompetence'], maturity: 'safe' },
  { id: 'circ-printer-broken', name: "Dealing with a printer that won't work", category: 'workplace', tags: ['technology', 'frustration', 'office'], maturity: 'safe' },
  { id: 'circ-worst-office-party', name: "Organizing the world's worst office party", category: 'workplace', tags: ['party', 'disaster', 'budget'], maturity: 'safe' },
  { id: 'circ-meeting-email', name: 'Leading a meeting that should have been an email', category: 'workplace', tags: ['meetings', 'pointless', 'corporate'], maturity: 'safe' },
  { id: 'circ-unqualified-interview', name: "Interviewing for a job you're not qualified for", category: 'workplace', tags: ['interview', 'bluffing', 'nervous'], maturity: 'safe' },
  { id: 'circ-best-man-speech', name: 'Giving a best man speech unprepared', category: 'romance', tags: ['wedding', 'speech', 'panic'], maturity: 'safe' },
  { id: 'circ-focus-group', name: 'Running a focus group that goes off the rails', category: 'workplace', tags: ['marketing', 'chaos', 'opinions'], maturity: 'safe' },

  // Adventure Gone Wrong
  { id: 'circ-corn-maze', name: 'Lost in a corn maze', category: 'adventure', tags: ['lost', 'maze', 'fall'], maturity: 'safe' },
  { id: 'circ-bake-off', name: 'Competing in a bake-off', category: 'sitcom', tags: ['competition', 'baking', 'pressure'], maturity: 'safe' },
  { id: 'circ-escape-room', name: 'Trapped in an escape room', category: 'adventure', tags: ['puzzles', 'teamwork', 'trapped'], maturity: 'safe' },
  { id: 'circ-flash-mob', name: 'Accidentally joining a flash mob', category: 'sitcom', tags: ['dancing', 'confused', 'public'], maturity: 'safe' },
  { id: 'circ-field-trip', name: 'Chaperoning a chaotic field trip', category: 'sitcom', tags: ['kids', 'chaos', 'responsibility'], maturity: 'safe' },
  { id: 'circ-talent-show-judge', name: 'Judging a talent show', category: 'sitcom', tags: ['competition', 'awkward', 'opinions'], maturity: 'safe' },
  { id: 'circ-kids-soccer', name: "Coaching a kids' soccer team", category: 'sitcom', tags: ['sports', 'kids', 'competition'], maturity: 'safe' },
  { id: 'circ-game-show', name: 'Competing on a game show', category: 'sitcom', tags: ['competition', 'pressure', 'prizes'], maturity: 'safe' },
  { id: 'circ-department-store', name: 'Trapped in a department store after hours', category: 'adventure', tags: ['trapped', 'night', 'shopping'], maturity: 'safe' },
  { id: 'circ-restaurant-rush', name: 'Running a restaurant during rush hour', category: 'workplace', tags: ['restaurant', 'chaos', 'pressure'], maturity: 'safe' },

  // Domestic Chaos
  { id: 'circ-babysitting', name: "Babysitting someone else's kids", category: 'sitcom', tags: ['kids', 'responsibility', 'chaos'], maturity: 'safe' },
  { id: 'circ-thanksgiving-feud', name: 'Hosting Thanksgiving with feuding relatives', category: 'sitcom', tags: ['family', 'holiday', 'drama'], maturity: 'safe' },
  { id: 'circ-mouse-hunt', name: 'Trying to catch a mouse in the house', category: 'sitcom', tags: ['pest', 'panic', 'domestic'], maturity: 'safe' },
  { id: 'circ-flooded-bathroom', name: 'Dealing with a flooded bathroom', category: 'sitcom', tags: ['plumbing', 'disaster', 'domestic'], maturity: 'safe' },
  { id: 'circ-priceless-antique', name: 'Accidentally destroying a priceless antique', category: 'sitcom', tags: ['accident', 'valuable', 'panic'], maturity: 'safe' },
  { id: 'circ-preparing-surprise', name: 'Preparing for a surprise party', category: 'sitcom', tags: ['party', 'secrets', 'stress'], maturity: 'safe' },
  { id: 'circ-exotic-pet', name: "Taking care of someone's exotic pet", category: 'sitcom', tags: ['pets', 'unusual', 'responsibility'], maturity: 'safe' },
  { id: 'circ-family-reunion', name: 'Stuck at a family reunion', category: 'sitcom', tags: ['family', 'awkward', 'trapped'], maturity: 'safe' },
  { id: 'circ-broken-spaceship', name: 'Dealing with a broken-down spaceship', category: 'scifi', tags: ['space', 'malfunction', 'stranded'], maturity: 'safe' },
  { id: 'circ-library-overnight', name: 'Accidentally locked in a library overnight', category: 'adventure', tags: ['trapped', 'books', 'night'], maturity: 'safe' },

  // ============================================================================
  // MATURE CIRCUMSTANCES
  // ============================================================================

  // Crime/Danger
  { id: 'circ-drug-deal-wrong', name: 'A drug deal gone wrong', category: 'crime', tags: ['drugs', 'danger', 'confrontation'], maturity: 'mature' },
  { id: 'circ-disposing-evidence', name: 'Disposing of evidence from a crime', category: 'crime', tags: ['crime', 'cover-up', 'paranoia'], maturity: 'mature' },
  { id: 'circ-elaborate-heist', name: 'Planning an elaborate heist', category: 'crime', tags: ['heist', 'planning', 'team'], maturity: 'mature' },
  { id: 'circ-interrogation', name: "Interrogating a suspect who won't talk", category: 'crime', tags: ['interrogation', 'tension', 'police'], maturity: 'mature' },
  { id: 'circ-money-laundering', name: 'Laundering money through a business', category: 'crime', tags: ['money', 'crime', 'business'], maturity: 'mature' },
  { id: 'circ-running-from-cops', name: 'Running from the cops', category: 'crime', tags: ['chase', 'police', 'escape'], maturity: 'mature' },
  { id: 'circ-hostage-negotiation', name: 'A tense hostage negotiation', category: 'crime', tags: ['hostage', 'negotiation', 'high-stakes'], maturity: 'mature' },
  { id: 'circ-covering-murder', name: 'Covering up a murder', category: 'crime', tags: ['murder', 'cover-up', 'dark'], maturity: 'mature' },
  { id: 'circ-testifying-mob', name: 'Testifying against the mob', category: 'crime', tags: ['court', 'mob', 'danger'], maturity: 'mature' },
  { id: 'circ-prison-break', name: 'A prison break attempt', category: 'crime', tags: ['prison', 'escape', 'planning'], maturity: 'mature' },
  { id: 'circ-home-invasion', name: 'Dealing with a home invasion', category: 'crime', tags: ['home', 'danger', 'intruder'], maturity: 'mature' },
  { id: 'circ-black-market-organs', name: 'Selling organs on the black market', category: 'crime', tags: ['black-market', 'organs', 'dark'], maturity: 'mature' },

  // Intense Drama
  { id: 'circ-3am-intervention', name: 'A drunken 3AM intervention', category: 'crime', tags: ['intervention', 'drunk', 'confrontation'], maturity: 'mature' },
  { id: 'circ-blackmail', name: 'A high-stakes blackmail negotiation', category: 'crime', tags: ['blackmail', 'secrets', 'power'], maturity: 'mature' },
  { id: 'circ-cheating-spouse', name: 'Confronting a cheating spouse', category: 'crime', tags: ['affair', 'confrontation', 'betrayal'], maturity: 'mature' },
  { id: 'circ-poker-game', name: 'A high-stakes poker game', category: 'crime', tags: ['gambling', 'tension', 'bluffing'], maturity: 'mature' },
  { id: 'circ-russian-roulette', name: 'Playing Russian roulette', category: 'crime', tags: ['danger', 'gambling', 'death'], maturity: 'mature' },
  { id: 'circ-divorce-mediation', name: 'A bitter divorce mediation', category: 'crime', tags: ['divorce', 'conflict', 'legal'], maturity: 'mature' },
  { id: 'circ-therapy-session', name: 'An uncomfortable therapy session', category: 'crime', tags: ['therapy', 'awkward', 'revelations'], maturity: 'mature' },
  { id: 'circ-hostile-takeover', name: 'A corporate hostile takeover', category: 'workplace', tags: ['corporate', 'power', 'ruthless'], maturity: 'mature' },
  { id: 'circ-affair-exposed', name: 'An affair being exposed publicly', category: 'crime', tags: ['affair', 'scandal', 'public'], maturity: 'mature' },
  { id: 'circ-inheritance-dispute', name: 'A family inheritance dispute', category: 'crime', tags: ['family', 'money', 'conflict'], maturity: 'mature' },

  // Dark Comedy
  { id: 'circ-accidental-cult', name: 'Accidentally starting a cult', category: 'sitcom', tags: ['cult', 'accident', 'absurd'], maturity: 'mature' },
  { id: 'circ-no-memory-dead-body', name: 'Waking up with no memory and a dead body', category: 'crime', tags: ['amnesia', 'murder', 'mystery'], maturity: 'mature' },
  { id: 'circ-bad-bank-robbery', name: 'A badly planned bank robbery', category: 'crime', tags: ['robbery', 'incompetent', 'comedy'], maturity: 'mature' },
  { id: 'circ-vegas-aftermath', name: 'A drug-fueled Vegas weekend aftermath', category: 'sitcom', tags: ['vegas', 'drugs', 'aftermath'], maturity: 'mature' },
  { id: 'circ-fake-death-insurance', name: 'Faking your own death for insurance', category: 'crime', tags: ['insurance', 'fraud', 'fake-death'], maturity: 'mature' },
  { id: 'circ-orgy-wrong', name: 'An orgy that goes terribly wrong', category: 'sitcom', tags: ['adult', 'awkward', 'disaster'], maturity: 'mature' },
  { id: 'circ-accidental-mafia', name: 'Accidentally joining the mafia', category: 'crime', tags: ['mafia', 'accident', 'trapped'], maturity: 'mature' },
  { id: 'circ-seance-works', name: 'A seance that actually works', category: 'horror', tags: ['supernatural', 'seance', 'unexpected'], maturity: 'mature' },

  // Thriller
  { id: 'circ-hunted-assassin', name: 'Being hunted by a professional assassin', category: 'action', tags: ['assassin', 'hunted', 'survival'], maturity: 'mature' },
  { id: 'circ-government-conspiracy', name: 'Discovering a government conspiracy', category: 'action', tags: ['conspiracy', 'government', 'danger'], maturity: 'mature' },
  { id: 'circ-mexican-standoff', name: 'A Mexican standoff', category: 'action', tags: ['standoff', 'guns', 'tension'], maturity: 'mature' },
  { id: 'circ-saw-scenario', name: 'Trapped in a Saw-like scenario', category: 'horror', tags: ['trap', 'survival', 'torture'], maturity: 'mature' },
  { id: 'circ-deadly-game', name: 'Playing a deadly game for survival', category: 'horror', tags: ['game', 'survival', 'death'], maturity: 'mature' },
  { id: 'circ-dangerous-stalker', name: 'Dealing with a dangerous stalker', category: 'horror', tags: ['stalker', 'danger', 'paranoia'], maturity: 'mature' },
  { id: 'circ-supernatural-wrong', name: 'A supernatural encounter gone wrong', category: 'horror', tags: ['supernatural', 'danger', 'unexpected'], maturity: 'mature' },
  { id: 'circ-serial-killer', name: 'Trapped with a serial killer', category: 'horror', tags: ['serial-killer', 'trapped', 'survival'], maturity: 'mature' },
  { id: 'circ-zombie-outbreak', name: 'A zombie outbreak (first hour)', category: 'horror', tags: ['zombies', 'outbreak', 'survival'], maturity: 'mature' },
  { id: 'circ-alien-abduction', name: 'Alien abduction interrogation', category: 'scifi', tags: ['aliens', 'abduction', 'interrogation'], maturity: 'mature' },

  // Additional Safe Circumstances - Everyday Mishaps
  { id: 'circ-wrong-wedding', name: 'Accidentally crashing the wrong wedding', category: 'romance', tags: ['wedding', 'mistake', 'awkward'], maturity: 'safe' },
  { id: 'circ-karaoke-disaster', name: 'Being forced to sing karaoke solo', category: 'sitcom', tags: ['karaoke', 'singing', 'stage-fright'], maturity: 'safe' },
  { id: 'circ-pet-sitting', name: 'Pet-sitting a high-maintenance animal', category: 'sitcom', tags: ['pets', 'responsibility', 'chaos'], maturity: 'safe' },
  { id: 'circ-speed-dating', name: 'Speed dating with increasingly weird people', category: 'romance', tags: ['dating', 'awkward', 'strangers'], maturity: 'safe' },
  { id: 'circ-class-reunion', name: 'Showing up to a class reunion unprepared', category: 'sitcom', tags: ['reunion', 'nostalgia', 'lying'], maturity: 'safe' },
  { id: 'circ-wrong-airplane-seat', name: 'Arguing over the wrong airplane seat', category: 'sitcom', tags: ['travel', 'conflict', 'confined'], maturity: 'safe' },
  { id: 'circ-home-renovation', name: 'A DIY home renovation gone completely wrong', category: 'sitcom', tags: ['renovation', 'disaster', 'incompetent'], maturity: 'safe' },
  { id: 'circ-cooking-show', name: 'Being a last-minute contestant on a cooking show', category: 'sitcom', tags: ['cooking', 'competition', 'pressure'], maturity: 'safe' },
  { id: 'circ-dog-show', name: 'Entering an untrained dog in a dog show', category: 'sitcom', tags: ['dog', 'competition', 'chaos'], maturity: 'safe' },
  { id: 'circ-wrong-costume-party', name: 'Wearing the wrong costume to a party', category: 'sitcom', tags: ['costume', 'embarrassment', 'party'], maturity: 'safe' },
  { id: 'circ-stuck-traffic', name: 'Stuck in traffic with an annoying passenger', category: 'sitcom', tags: ['traffic', 'confined', 'patience'], maturity: 'safe' },
  { id: 'circ-gym-first-time', name: 'First day at a fancy gym with no idea what to do', category: 'sitcom', tags: ['gym', 'exercise', 'clueless'], maturity: 'safe' },
  { id: 'circ-tech-support', name: 'Explaining technology to elderly relatives', category: 'sitcom', tags: ['technology', 'family', 'patience'], maturity: 'safe' },
  { id: 'circ-moving-day', name: 'Moving day with unreliable friends', category: 'sitcom', tags: ['moving', 'friends', 'frustration'], maturity: 'safe' },
  { id: 'circ-selfie-obsession', name: 'Trying to get the perfect selfie in public', category: 'sitcom', tags: ['selfie', 'embarrassment', 'social-media'], maturity: 'safe' },
  { id: 'circ-lost-tourist', name: 'Being a lost tourist who refuses to ask for directions', category: 'sitcom', tags: ['travel', 'lost', 'stubborn'], maturity: 'safe' },
  { id: 'circ-blind-date', name: 'A blind date that keeps getting worse', category: 'romance', tags: ['date', 'disaster', 'awkward'], maturity: 'safe' },
  { id: 'circ-wrong-person-wave', name: 'Waving at someone who wasn\'t waving at you', category: 'sitcom', tags: ['awkward', 'embarrassment', 'social'], maturity: 'safe' },
  { id: 'circ-automated-phone', name: 'Arguing with an automated phone system', category: 'sitcom', tags: ['technology', 'frustration', 'customer-service'], maturity: 'safe' },
  { id: 'circ-camping-nightmare', name: 'A camping trip with no camping experience', category: 'adventure', tags: ['camping', 'nature', 'incompetent'], maturity: 'safe' },

  // Additional Safe Circumstances - Fantasy/Adventure
  { id: 'circ-magic-spell-wrong', name: 'A magic spell that goes hilariously wrong', category: 'fantasy', tags: ['magic', 'spell', 'backfire'], maturity: 'safe' },
  { id: 'circ-dragon-negotiation', name: 'Trying to negotiate with a stubborn dragon', category: 'fantasy', tags: ['dragon', 'negotiation', 'treasure'], maturity: 'safe' },
  { id: 'circ-time-travel-loop', name: 'Stuck in a time loop on the worst day ever', category: 'scifi', tags: ['time-loop', 'repetition', 'frustration'], maturity: 'safe' },
  { id: 'circ-superhero-training', name: 'First day of superhero training', category: 'action', tags: ['superhero', 'training', 'incompetent'], maturity: 'safe' },
  { id: 'circ-quest-boring', name: 'An epic quest that turns out to be incredibly boring', category: 'adventure', tags: ['quest', 'anticlimactic', 'walking'], maturity: 'safe' },
  { id: 'circ-robot-malfunction', name: 'Your helpful robot assistant malfunctions', category: 'scifi', tags: ['robot', 'malfunction', 'chaos'], maturity: 'safe' },
  { id: 'circ-alien-first-contact', name: 'Making first contact with confused aliens', category: 'scifi', tags: ['aliens', 'communication', 'misunderstanding'], maturity: 'safe' },
  { id: 'circ-chosen-one-mistake', name: 'Being told you\'re the chosen one by mistake', category: 'fantasy', tags: ['chosen-one', 'mistake', 'prophecy'], maturity: 'safe' },
  { id: 'circ-treasure-map-fake', name: 'Following a treasure map that might be fake', category: 'adventure', tags: ['treasure', 'map', 'doubt'], maturity: 'safe' },
  { id: 'circ-magic-item-cursed', name: 'Discovering your magic item is cursed', category: 'fantasy', tags: ['curse', 'magic-item', 'regret'], maturity: 'safe' },

  // Additional Safe Circumstances - Workplace Extended
  { id: 'circ-viral-email', name: 'Accidentally replying-all to the entire company', category: 'workplace', tags: ['email', 'mistake', 'embarrassment'], maturity: 'safe' },
  { id: 'circ-video-call-disaster', name: 'A video call where everything goes wrong', category: 'workplace', tags: ['video-call', 'technical', 'chaos'], maturity: 'safe' },
  { id: 'circ-parking-spot', name: 'Feuding with a coworker over a parking spot', category: 'workplace', tags: ['parking', 'conflict', 'petty'], maturity: 'safe' },
  { id: 'circ-office-potluck', name: 'Bringing the worst dish to the office potluck', category: 'workplace', tags: ['food', 'potluck', 'embarrassment'], maturity: 'safe' },
  { id: 'circ-promotion-rival', name: 'Competing with your best friend for a promotion', category: 'workplace', tags: ['promotion', 'competition', 'friendship'], maturity: 'safe' },
  { id: 'circ-boss-birthday', name: 'Planning a birthday party for a boss nobody likes', category: 'workplace', tags: ['party', 'boss', 'fake'], maturity: 'safe' },
  { id: 'circ-coffee-machine', name: 'The office coffee machine breaks during deadline week', category: 'workplace', tags: ['coffee', 'crisis', 'caffeine'], maturity: 'safe' },
  { id: 'circ-secret-santa-bad', name: 'Getting the worst secret santa gift', category: 'workplace', tags: ['christmas', 'gift', 'disappointment'], maturity: 'safe' },

  // Additional Safe Circumstances - Performance/Creative
  { id: 'circ-improv-freeze', name: 'Freezing up during an improv performance', category: 'sitcom', tags: ['improv', 'stage-fright', 'performance'], maturity: 'safe' },
  { id: 'circ-dance-recital', name: 'Adult beginner dance recital', category: 'sitcom', tags: ['dance', 'performance', 'awkward'], maturity: 'safe' },
  { id: 'circ-public-speaking', name: 'Public speaking with severe stage fright', category: 'sitcom', tags: ['speech', 'fear', 'audience'], maturity: 'safe' },
  { id: 'circ-band-reunion', name: 'Reuniting your terrible garage band', category: 'sitcom', tags: ['music', 'band', 'nostalgia'], maturity: 'safe' },
  { id: 'circ-talent-show-fail', name: 'Performing a talent you don\'t actually have', category: 'sitcom', tags: ['talent-show', 'deception', 'exposure'], maturity: 'safe' },
  { id: 'circ-podcast-first', name: 'Recording your first podcast episode', category: 'sitcom', tags: ['podcast', 'awkward', 'technical'], maturity: 'safe' },
  { id: 'circ-youtube-tutorial', name: 'Following a YouTube tutorial that\'s completely wrong', category: 'sitcom', tags: ['youtube', 'tutorial', 'disaster'], maturity: 'safe' },
  { id: 'circ-viral-moment', name: 'Going accidentally viral for an embarrassing moment', category: 'sitcom', tags: ['viral', 'embarrassment', 'internet'], maturity: 'safe' },
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
        (item.source && item.source.toLowerCase().includes(query)) ||
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

/**
 * Get random content for card selection (backwards compatible)
 */
export function getRandomContent(
  type: 'characters' | 'settings' | 'circumstances',
  isMature: boolean,
  count: number = 3
): string[] {
  const content = getFilteredContent(isMature)
  const pool = content[type]
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// ============================================================================
// GREEN ROOM TRIVIA QUESTIONS
// ============================================================================

// Green Room trivia questions (setting-specific)
// These appear during AI generation to mask latency and keep players engaged
export const GREEN_ROOM_QUESTIONS: Record<string, string[]> = {
  // Sitcoms
  "Central Perk (Friends)": [
    "What was the name of Ross's pet monkey?",
    "How many times did Ross get divorced?",
    "What's Chandler's middle name?",
    "What color is Monica's apartment door?",
    "What instrument does Phoebe play?",
    "What's Joey's catchphrase?",
    "Where does Rachel work in the later seasons?",
    "What's the name of Phoebe's twin sister?"
  ],

  "The Office Conference Room (The Office)": [
    "What's the name of Michael's improv character?",
    "What did Jim put Dwight's stapler in?",
    "What's the name of Dunder Mifflin's competing paper company?",
    "What's Dwight's middle name?",
    "What instrument does Andy play?",
    "What's Kevin's famous chili recipe secret?",
    "What type of farm does Dwight own?",
    "What's the name of the documentary crew?"
  ],

  "MacLaren's Pub (How I Met Your Mother)": [
    "What's Barney's job?",
    "What's the name of Marshall's law school nemesis?",
    "What's Ted's profession?",
    "What instrument does Ted steal?",
    "What's Lily's favorite cocktail?",
    "What's the name of Barney's video resume?",
    "What does 'suit up' mean?",
    "What's Robin's secret teenage pop star identity?"
  ],

  "Pawnee City Hall (Parks and Rec)": [
    "What's Ron Swanson's favorite meal?",
    "What's Leslie's favorite food?",
    "What's the name of Andy's band?",
    "What animal does Li'l Sebastian represent?",
    "What's Tom's clothing brand called?",
    "What's April's husband's name?",
    "What's Donna's catchphrase about treating yourself?",
    "What department does Leslie run?"
  ],

  "Apartment 4A (The Big Bang Theory)": [
    "What's Sheldon's spot on the couch?",
    "What game do the guys play every week?",
    "What's Penny's last name?",
    "What's Howard's nickname for his mother?",
    "What instrument does Howard play?",
    "What's Raj's biggest social problem?",
    "What's Sheldon's favorite number?",
    "What store do the guys shop at for comics?"
  ],

  // Star Wars
  "The Death Star (Star Wars)": [
    "What's the name of Han Solo's ship?",
    "What color is Mace Windu's lightsaber?",
    "What planet is Princess Leia from?",
    "What species is Chewbacca?",
    "What's Darth Vader's real name?",
    "What do they call the Force users trained in the dark side?",
    "What's the name of the ice planet?",
    "What creature lives in the trash compactor?"
  ],

  "The Millennium Falcon (Star Wars)": [
    "Who originally owned the Millennium Falcon before Han?",
    "What famous Kessel Run record does Han claim?",
    "What species is Yoda?",
    "What's the name of Jabba the Hutt's palace planet?",
    "What weapon destroys entire planets?",
    "What's Luke's home planet?",
    "What's the Jedi weapon called?",
    "What does AT-AT stand for?"
  ],

  // Harry Potter
  "Hogwarts Great Hall (Harry Potter)": [
    "What house is Harry sorted into?",
    "What's Hermione's patronus?",
    "What position does Harry play in Quidditch?",
    "What's the name of Hagrid's three-headed dog?",
    "What platform does the Hogwarts Express leave from?",
    "What spell is used to disarm someone?",
    "What's the name of Harry's owl?",
    "What are the four Hogwarts houses?"
  ],

  "Diagon Alley (Harry Potter)": [
    "What's the name of the wizard bank?",
    "What shop sells wands?",
    "What's the wizard currency called?",
    "What pub is the entrance to Diagon Alley?",
    "What creatures run the bank?",
    "What's the name of the joke shop?",
    "What creature pulls the carts at Gringotts?",
    "What type of wood is Harry's wand?"
  ],

  // Breaking Bad Universe
  "Los Pollos Hermanos (Breaking Bad)": [
    "What's Walter White's street name?",
    "What color is the meth that Walter makes?",
    "What's Jesse's catchphrase?",
    "What car does Walter White drive?",
    "What's the name of Saul's assistant?",
    "What element is Walter White named after?",
    "What does Gus Fring's restaurant sell?",
    "What's Hank's job?"
  ],

  "The Superlab (Breaking Bad)": [
    "What business does Skyler buy to launder money?",
    "What pizza topping causes the famous roof throw?",
    "What's Mike's former job?",
    "What's the name of Jesse's street dealers?",
    "What color is Marie obsessed with?",
    "What mineral does Hank collect?",
    "What RV do Walter and Jesse use?",
    "What's the purity of Walter's meth?"
  ],

  // The Sopranos
  "The Bada Bing! (The Sopranos)": [
    "What's Tony Soprano's job (officially)?",
    "What animal does Tony see his therapist about?",
    "What's the name of Tony's therapist?",
    "What deli meat does Tony discuss in therapy?",
    "What's Christopher's screenplay about?",
    "What's Paulie's superstition about?",
    "What does Tony claim his waste management company does?",
    "What's Carmela's biggest complaint about Tony?"
  ],

  // Mad Men
  "Sterling Cooper Office (Mad Men)": [
    "What decade is Mad Men set in?",
    "What's Don Draper's real name?",
    "What product does Peggy create a famous campaign for?",
    "What floor is Sterling Cooper on?",
    "What's Roger Sterling's favorite drink?",
    "What secretary becomes a copywriter?",
    "What product does Don pitch with a carousel?",
    "What's the name of the merged company?"
  ],

  // Stranger Things
  "The Upside Down (Stranger Things)": [
    "What's Eleven's favorite food?",
    "What game do the kids play in Mike's basement?",
    "What's the name of the monster in Season 1?",
    "Where does Joyce communicate with Will?",
    "What store does Steve work at?",
    "What's Dustin's pet called?",
    "What band does Eddie play in?",
    "What decade is Season 1 set in?"
  ],

  "Hawkins Lab (Stranger Things)": [
    "What's Eleven's real name?",
    "What number is Eleven?",
    "What scientist runs the lab?",
    "What company owns the lab?",
    "What powers does Eleven have?",
    "What snack does Eleven love?",
    "What hairstyle does Barb have?",
    "What's the shadow monster called?"
  ],

  // Rick and Morty
  "Rick's Garage (Rick and Morty)": [
    "What's Rick's signature catchphrase?",
    "What's the name of Rick's spaceship?",
    "What dimension do Rick and Morty come from?",
    "What's Mr. Meeseeks' purpose?",
    "What sauce is Rick obsessed with?",
    "What's the name of the family's dog?",
    "What planet do Rick and Morty bury themselves on?",
    "What's Beth's profession?"
  ],

  // Marvel
  "Stark Tower (Marvel)": [
    "What's Tony Stark's AI called?",
    "What element does Tony create in his lab?",
    "What's Captain America's real name?",
    "What's Black Widow's real name?",
    "What metal is Captain America's shield made of?",
    "What's Thor's hammer called?",
    "What's Iron Man's suit powered by?",
    "What's the name of S.H.I.E.L.D.'s helicarrier?"
  ],

  // Batman
  "The Batcave (Batman)": [
    "What's Batman's real name?",
    "What city does Batman protect?",
    "What's the name of Batman's butler?",
    "What happened to Bruce Wayne's parents?",
    "What's the Joker's real name?",
    "What company does Bruce Wayne own?",
    "What's Batman's vehicle called?",
    "What's Robin's real name?"
  ],

  // Lord of the Rings
  "The Shire (Lord of the Rings)": [
    "What's the name of Frodo's gardener?",
    "What's the name of the ring?",
    "What meal do Hobbits have between breakfast and lunch?",
    "What's Gandalf's horse's name?",
    "What creature was Gollum before he found the ring?",
    "What's the name of the tavern in Bree?",
    "What's Aragorn's nickname?",
    "What food do Hobbits love?"
  ],

  "Rivendell (Lord of the Rings)": [
    "What race is Legolas?",
    "What race is Gimli?",
    "How many members are in the Fellowship?",
    "What's the name of Gandalf's wizard order?",
    "What color is Gandalf when he returns?",
    "What's Elrond's role in Rivendell?",
    "What's the Elven word for friend?",
    "What weapon does Gimli use?"
  ],

  // It's Always Sunny
  "Paddy's Pub (It's Always Sunny)": [
    "What's the name of the bar?",
    "What state is the show set in?",
    "What instrument does Charlie 'play'?",
    "What's Dennis's implication theory?",
    "What does Frank keep in his couch?",
    "What's Charlie's job at the bar?",
    "What's Mac's signature move?",
    "What's Dee's nickname?"
  ],

  // Generic/Default fallback questions
  "default": [
    "What's your favorite movie scene of all time?",
    "If you could have any superpower, what would it be?",
    "What's the best TV show you've watched recently?",
    "What character would you want to be for a day?",
    "What's your comfort food?",
    "If you could visit any fictional place, where would you go?",
    "What's your go-to karaoke song?",
    "What's the weirdest thing you've ever eaten?",
    "If you could time travel, which decade would you visit?",
    "What's your hidden talent?",
    "What's your favorite plot twist in a movie?",
    "If you had to survive a zombie apocalypse with one character, who would it be?",
    "What's the most quotable movie of all time?",
    "Which fictional vehicle would you drive?",
    "What's your favorite one-liner from any show?",
    "If you could recast any movie character, who would you choose?"
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
