import json
from pathlib import Path
p=[]
def add(id,title,category,summary,body,**kw):
    p.append(dict(id=id,title=title,category=category,summary=summary,body=body.strip(),cover='',aliases=kw.get('aliases',[]),facts=kw.get('facts',[]),icon=kw.get('icon','✦')))
def facts(**kwargs):return [[k,v] for k,v in kwargs.items()]
add('the-four-seasons','The Four Seasons','Party','A band of travelers whose paths have become entwined with the fate of kingdoms, moonlight, and shadow.', '''# A name forged on the road
The **Four Seasons** is the name adopted by the adventuring party during their travels through [[Kestrel Ford]]. Their story began far to the north, in [[Port Llast]], where an investigation at the [[Port Llast Lighthouse]] led them into a mystery involving [[Selûne]], [[Shar]], and the [[Moon Scroll]].

## The adventurers
The company has included [[Bramwell Elixor]], [[Luna]], [[Bjorn]], and [[Fenwick]]. Allies met along the way include [[Jimsko]], [[Brick]], and [[Estephan]].

## A widening world
What began on the Sword Coast has carried the travelers through [[Neverwinter]] and toward [[Thamor]], where politics and a looming threat known as the [[Dragon's Due]] have begun to cast a long shadow.

> Some legends begin with a prophecy. Others begin with a few strangers choosing to walk the same road.

## Chronicle
Read the [[Campaign Chronicle]] for the group's journey so far.''',aliases=['Four Seasons','the party'],facts=facts(Campaign='The Daughter of the Moon',Region='Sword Coast and beyond',First_chapter='Port Llast'),icon='❖')
add('campaign-chronicle','Campaign Chronicle','Chronicle','A player-friendly record of the travels and turning points of The Four Seasons.', '''# A chronicle of the road
## Chapter I — The light at Port Llast
The adventurers arrived at [[Port Llast]], spoke with its people, and uncovered unsettling events surrounding the [[Port Llast Lighthouse]]. Their travels brought them into the [[Caverns of Lior]] and into possession of the mysterious [[Moon Scroll]].

## Chapter II — The road to Neverwinter
Following the events in Port Llast, the party traveled toward [[Neverwinter]], a city of crowns, traders, and uneasy loyalties. There, their discoveries drew greater attention.

## Saga II — The roads of Threskel
The group continued toward [[Kestrel Ford]], where they adopted the name [[The Four Seasons]]. The journey eventually led them into [[Thamor]] and its crowded streets, as the young [[King Arven I]] prepared to preside over a knighting ceremony.

## Most recently
At the celebration in [[Thamor]], an attempted attack disturbed the ceremony. The city now stands at the intersection of royal ambition, rival claims, and the threat of the [[Dragon's Due]].

*This chronicle records the broad strokes of events known to the party. Individual entries can be expanded after each session.*''',facts=facts(Format='Player-safe session history',Current_arc='Saga II — Thamor'),icon='⌛')
add('bramwell-elixor','Bramwell Elixor','Characters','A human cleric of Helm whose convictions have drawn both admiration and controversy.', '''# The watchful hand
**Bramwell Elixor** is a human cleric devoted to [[Helm]]. A practiced alchemist as well as a priest, he has walked a difficult line between faith, responsibility, and what he believes to be right.

Bramwell became known for his efforts to help those afflicted by a terrible plague. That work, and the choices surrounding it, have complicated his relationship with religious authority.

## Travels
A founding member of [[The Four Seasons]], Bramwell has journeyed through [[Port Llast]], [[Neverwinter]], and [[Thamor]]. During the knighting ceremony in Thamor, he reacted to an arrow aimed into the gathering.

## Known connections
- [[Helm]] — god of guardians and vigilance
- [[The Four Seasons]] — his companions
- [[Luna]] and [[Bjorn]] — fellow adventurers''',facts=facts(Ancestry='Human',Calling='Cleric',Faith='Helm',Association='The Four Seasons'),icon='⚔')
add('luna','Luna','Characters','A wanderer whose story is still unfolding, with strange dreams and ties to the world of the fey.', '''# A life written in questions
**Luna** travels with [[The Four Seasons]]. Mysterious dreams, unusual encounters, and the pull of the fey have followed her adventures.

Once known for her roguish talents, Luna's journey has taken her toward strange magic and a personal history that is not yet fully understood.

## On the road
Luna has traveled alongside [[Bramwell Elixor]] and [[Bjorn]] through [[Port Llast]], [[Neverwinter]], and the lands around [[Thamor]].

## A living entry
More of Luna's history will be added as it becomes part of the shared campaign story.''',facts=facts(Association='The Four Seasons',Known_for='Unusual dreams and fey encounters'),icon='☾')
add('bjorn','Bjorn','Characters','A towering goliath barbarian, formidable in battle and loyal to his companions.', '''# Strength on the road
**Bjorn** is a goliath warrior and a member of [[The Four Seasons]].

A son of [[Jimsko]], Bjorn carries his strength and resolve through each hard-won adventure, from the shores near [[Port Llast]] to the roads beyond [[Neverwinter]].

His story is closely entwined with those of [[Bramwell Elixor]], [[Luna]], and their fellow travelers.''',facts=facts(Ancestry='Goliath',Calling='Barbarian',Family='Jimsko',Association='The Four Seasons'),icon='✊')
add('fenwick','Fenwick','Characters','A gnome druid, also known as Xero, who once traveled with the company.', '''# The druid of the wilds
**Fenwick**, sometimes called **Xero**, is a gnome druid and a former traveling member of [[The Four Seasons]].

His familiarity with the natural world brought a different outlook to the group during their journeys. His road has since separated from the company’s, though his part in their history remains.

See also: [[Campaign Chronicle]].''',aliases=['Xero'],facts=facts(Ancestry='Gnome',Calling='Druid',Status='Former companion'),icon='❀')
add('jimsko','Jimsko','Characters','A dwarf with longstanding ties to the adventurers and an especially personal stake in Bjorn’s journey.', '''# The dwarf called Jimsko
**Jimsko**, also known as **Jimmy Jim**, is a dwarf whose path crossed that of [[The Four Seasons]] in [[Port Llast]].

He is the father of [[Bjorn]]. Familiar to the adventurers from their earliest travels, Jimsko helped introduce [[Estephan]] to the company.

For all the great affairs of kings and gods, Jimsko is a reminder that this adventure began among ordinary people.''',aliases=['Jimmy Jim'],facts=facts(Ancestry='Dwarf',Family='Bjorn',First_known='Port Llast'),icon='🍺')
add('yulia','Princess Yulia','Characters','A spirited princess of Neverwinter with silver hair and striking moonlike eyes.', '''# The princess of Neverwinter
**Princess Yulia** is a member of the royal family of [[Neverwinter]]. Her silver hair and moonlike eyes have made her memorable to those who have met her.

Despite royal expectations, Yulia is known for her lively spirit, willingness to speak her mind, and concern for the people beyond the palace walls.

Her story has begun to intersect with that of [[The Four Seasons]].''',aliases=['Yulia'],facts=facts(Title='Princess',Home='Neverwinter'),icon='♕')
add('arven','King Arven I','Characters','The young king of Thamor, trying to wear a crown in an uncertain age.', '''# A young crown
**King Arven I** rules [[Thamor]] at an age when most children are still discovering who they wish to become.

The king presided over a much-anticipated knighting ceremony in [[Crown Square]], attended by guards, residents, and visiting dignitaries. An attempted attack disrupted the festivities.

## A contested future
Thamor faces outside pressure from [[Mourktar]], while the ominous [[Dragon's Due]] weighs on public conversation. With a child on the throne, every public appearance carries political weight.''',aliases=['Arven'],facts=facts(Title='King of Thamor',Age='13',Residence='Thamor'),icon='♛')
add('cinder','Cinder','Characters','An intriguing figure encountered amid the bustle and politics of Thamor.', '''# A curious acquaintance
**Cinder** is a figure the travelers met while exploring [[Thamor]]. Conversations with Cinder unfolded against a backdrop of crowded markets and preparations for [[King Arven I]]’s knighting ceremony.

Much about Cinder remains to be learned. This entry will grow as the company discovers more.''',facts=facts(Encountered='Thamor'),icon='✧')
add('grath','Grath Erlkar','Characters','A veteran leader and first captain associated with Port Llast.', '''# The first captain
**Grath Erlkar** is a prominent civic figure in [[Port Llast]], known as its First Captain.

Grath's position places him among the townspeople most closely concerned with keeping this northern port functioning amid dangers at sea and ashore.''',facts=facts(Title='First Captain',Home='Port Llast',Age='58'),icon='⚓')
add('velka','Velka','Characters','A dangerous adversary encountered in the caverns near Port Llast.', '''# The cavern leader
**Velka** led a hostile group encountered in the [[Caverns of Lior]], near [[Port Llast]].

The adventurers overcame Velka and captured their opponent alive during their investigation of the region.

See [[Campaign Chronicle]] for the surrounding events.''',facts=facts(Associated_place='Caverns of Lior',Status='Captured alive'),icon='☠')
add('wiwi','Wiwi','Characters','A fairy whose appearance added a hint of the uncanny to the journey.', '''# A flicker of fairy light
**Wiwi** is a fairy known to [[The Four Seasons]].

Not every story in the company's travels belongs to castles and grand designs. Some arrive on small wings, carried by the erratic magic of the fey.''',facts=facts(Kind='Fairy'),icon='🦋')
add('brick','Brick','Characters','A crab companion who has become a small but memorable part of the group.', '''# The smallest adventurer?
**Brick** is a **crab** companion of [[The Four Seasons]].

Lacking the stature of [[Bjorn]] or the spellcraft of [[Bramwell Elixor]], Brick nevertheless deserves his place in the adventuring record.

*Yes, Brick is a crab.*''',facts=facts(Species='Crab',Association='The Four Seasons'),icon='🦀')
add('estephan','Estephan','Characters','A mouse familiar and an unusual addition to the adventuring company.', '''# A tiny fellow traveler
**Estephan** is a mouse familiar introduced to [[The Four Seasons]] through [[Jimsko]] during their time in [[Port Llast]].

A diminutive companion in a world of towering monsters and towering egos, Estephan has earned an entry of his own.''',facts=facts(Species='Mouse',Association='The Four Seasons'),icon='🐭')
add('port-llast','Port Llast','Locations','A northern coastal settlement where the party’s adventures began.', '''# Where the sea meets the story
**Port Llast** lies on the northern [[Sword Coast]]. To travelers, it is a modest port town; to [[The Four Seasons]], it is where their common adventure truly began.

## Places to know
- [[The Net & Keg]] — an inn and tavern where stories and rumors mingle
- [[Port Llast Lighthouse]] — a coastal landmark at the center of a disturbing investigation
- [[Caverns of Lior]] — caverns beyond the town, where danger and discovery awaited

## People
Among those connected with Port Llast are [[Grath Erlkar]] and [[Jimsko]].''',facts=facts(Region='Sword Coast',Type='Coastal settlement'),icon='⚓')
add('net-and-keg','The Net & Keg','Locations','A familiar tavern and inn in Port Llast.', '''# The Net & Keg
The **Net & Keg** is an inn and tavern in [[Port Llast]]. A place of food, talk, and passing travelers, it belongs to the earliest chapter of [[The Four Seasons]]' adventures.

*What tales will the next patron bring through the door?*''',aliases=['Net & Keg','Net and Keg'],facts=facts(Location='Port Llast',Type='Inn and tavern'),icon='🍻')
add('lighthouse','Port Llast Lighthouse','Locations','The lighthouse at Port Llast, whose mystery led the party toward something far larger.', '''# The light on the coast
The **Port Llast Lighthouse** watches the coastline near [[Port Llast]]. During the party's early investigation, the structure and the nearby shore became the focus of troubling activity.

Beneath the lighthouse, the travelers found an old shrine connected with [[Selûne]]. The discoveries made there helped set them on the trail of the [[Moon Scroll]].''',aliases=['the lighthouse','Lighthouse'],facts=facts(Location='Port Llast',Feature='Shrine beneath the lighthouse'),icon='♜')
add('caverns-lior','Caverns of Lior','Locations','A network of dangerous caverns visited during the first leg of the adventure.', '''# Beneath the earth
The **Caverns of Lior** are a cave system near [[Port Llast]]. During their search for answers, [[The Four Seasons]] entered the caverns and faced [[Velka]] and hostile inhabitants.

The journey through the caverns became one of the defining moments of their earliest adventures.''',facts=facts(Region='Near Port Llast',Type='Cavern system'),icon='⛰')
add('neverwinter','Neverwinter','Locations','The celebrated Jewel of the North, a great city on the Sword Coast.', '''# The Jewel of the North
**Neverwinter** stands among the best-known cities of the [[Sword Coast]]. Its courts, markets, and avenues offer opportunity in equal measure to peril.

[[The Four Seasons]] journeyed here following their adventures at [[Port Llast]]. Among the figures tied to its royal household is [[Princess Yulia]].

## A city of many stories
The city is a place of temples, trade, politics, and countless lives whose stories continue whether or not adventurers are present.''',facts=facts(Region='Sword Coast',Type='Major city'),icon='♜')
add('luskan','Luskan','Locations','A hard-edged northern city of ships, intrigue, and competing powers.', '''# City of Sails
**Luskan** is a northern city on the [[Sword Coast]], known for its ships and formidable reputation.

Its history and rivalries form part of the wider world through which [[The Four Seasons]] travel. Not every secret of Luskan has yet found its way into the party's chronicle.''',facts=facts(Region='Sword Coast',Type='Port city'),icon='⛵')
add('sword-coast','Sword Coast','Locations','A long stretch of western Faerûn, home to seaports, cities, and lonely roads.', '''# Along the western shore
The **Sword Coast** is a region of western Faerûn where major trade cities stand beside old forests, seaside settlements, and dangerous stretches of wilderness.

For [[The Four Seasons]], the road here has connected [[Port Llast]], [[Neverwinter]], and the shadow of [[Luskan]].

The coast's bustle hides many smaller stories in its roadside inns, forgotten shrines, and rocky inlets.''',facts=facts(Continent='Faerûn',Type='Geographic region'),icon='🗺')
add('kestrel-ford','Kestrel Ford','Locations','A lively road village where the adventurers chose their name.', '''# The village at the ford
**Kestrel Ford** is a village on the journey toward [[Thamor]]. Its roads carry merchants, local news, and travelers with different reasons to hurry onward.

It was around this stage of their travels that the party took the name [[The Four Seasons]].

Here, ordinary village life briefly offered a contrast to the great affairs waiting in the city ahead.''',facts=facts(Region='Road to Thamor',Type='Village',Noted_event='Naming of the Four Seasons'),icon='🌾')
add('thamor','Thamor','Locations','A city of blue-and-gold banners, a child king, and uneasy celebrations.', '''# Under blue and gold
**Thamor** is a crowded city ruled by [[King Arven I]]. Visitors find lively streets, merchants, ceremony preparations, and the constant movement of a city hoping for a stable future.

## The crown and its rivals
Thamor's independence has drawn pressure from [[Mourktar]], while stories of the [[Dragon's Due]] have troubled its residents.

## A public gathering
At [[Crown Square]], the young king's knighting ceremony drew a large crowd and a formidable guard presence. [[The Four Seasons]] witnessed an attempted attack during the proceedings.

The party has also crossed paths with [[Cinder]] in the city.''',facts=facts(Region='Threskel',Ruler='King Arven I',Known_for='The knighting ceremony'),icon='🏰')
add('crown-square','Crown Square','Locations','The ceremonial heart of Thamor and the setting of a memorable knighting.', '''# A square beneath the banners
**Crown Square** is a prominent public gathering place in [[Thamor]]. During [[King Arven I]]'s knighting ceremony, the square thronged with guards, nobles, townsfolk, and visiting spectators.

An arrow and the appearance of assailants cast a sudden shadow over the celebration. [[Bramwell Elixor]] was among those who reacted to the danger.''',facts=facts(City='Thamor',Known_event='Knighting ceremony'),icon='⚜')
add('mourktar','Mourktar','Locations','A rival power whose dealings with Thamor have become a topic of concern.', '''# Beyond Thamor
**Mourktar** is a distant center of power mentioned in connection with [[Thamor]]'s political situation.

The city and its envoys are discussed in the context of competing claims, diplomatic pressure, and the future of [[King Arven I]]'s reign.

What these tensions mean for the adventurers remains to be seen.''',facts=facts(Associated_with='Thamor',Type='City / political power'),icon='⚖')
add('blackreach','Blackreach','Locations','A place remembered from the party’s travels before they reached Kestrel Ford.', '''# A road behind them
**Blackreach** is a location in the recent travels of [[The Four Seasons]], before their arrival at [[Kestrel Ford]].

This is a short entry, ready to be expanded with player-confirmed recollections and discoveries.''',facts=facts(Status='Previously visited'),icon='☁')
add('selune','Selûne','Deities & Lore','The Moonmaiden, deity of moonlight, whose name threads through the campaign.', '''# The Moonmaiden
**Selûne**, the Moonmaiden, is a deity associated with the moon, guiding light, and those who seek their way through darkness.

A shrine beneath the [[Port Llast Lighthouse]] and the discovery of the [[Moon Scroll]] drew the attention of [[The Four Seasons]] to the goddess and her history.

Selûne's ancient opposition to [[Shar]] lies at the heart of many stories in the world.''',aliases=['Selune','Moonmaiden'],facts=facts(Sphere='Moon and moonlight',Rival='Shar'),icon='☾')
add('shar','Shar','Deities & Lore','The Lady of Loss, a deity associated with darkness and secrets.', '''# The Lady of Loss
**Shar** is a deity often associated with darkness, loss, and hidden things.

Her legendary conflict with [[Selûne]] is known far beyond temples and ancient manuscripts. The [[Moon Scroll]] has brought echoes of that conflict close to [[The Four Seasons]].

Much remains unknown about what this history may mean for the present.''',facts=facts(Sphere='Darkness and loss',Rival='Selûne'),icon='◈')
add('helm','Helm','Deities & Lore','The Watcher, god of guardians, duty, and vigilance.', '''# The Watcher
**Helm** is the god of watchfulness and guardianship, revered by those sworn to stand between danger and the people they protect.

[[Bramwell Elixor]] serves Helm as a cleric, although questions of doctrine and duty have not always led him down the easiest path.''',facts=facts(Sphere='Guardians and vigilance',Known_follower='Bramwell Elixor'),icon='🛡')
add('moon-scroll','Moon Scroll','Artifacts','An ancient scroll whose discovery changed the direction of the party’s journey.', '''# A recovered mystery
The **Moon Scroll** is an ancient document recovered during the early adventures of [[The Four Seasons]]. The party's investigation of the [[Port Llast Lighthouse]] and [[Caverns of Lior]] placed the scroll at the center of their journey.

The writing has been connected with ancient Netherese language and with the histories of [[Selûne]] and [[Shar]].

## What remains unknown
Its full implications are not yet part of the public chronicle. This entry records only what the travelers have learned.''',aliases=['the scroll','prophecy scroll'],facts=facts(Type='Ancient scroll',Found_during='Port Llast arc'),icon='📜')
add('dragons-due',"Dragon's Due",'Deities & Lore','An ominous obligation discussed in connection with Thamor and a red dragon.', '''# A shadow over the city
The phrase **Dragon's Due** is spoken around [[Thamor]] as a source of apprehension.

It is associated with reports of a powerful red dragon and concerns over the city's security and autonomy. Political tensions involving [[Mourktar]] have only increased uncertainty.

How much is rumor, how much is threat, and how much is politics remains to be discovered by [[The Four Seasons]].''',aliases=['Dragons Due','the Due'],facts=facts(Associated_place='Thamor',Nature='Unresolved threat'),icon='🐉')
add('how-to-use','How to Use This Wiki','Guides','A quick introduction to browsing and contributing to the living campaign encyclopedia.', '''# Welcome to the archive
This wiki is written for players of **The Daughter of the Moon**. It grows as the party discovers people, places, artifacts, and stories.

## Finding articles
Use the **Search** field, browse the category library, or follow highlighted names inside any article. Names that already have entries are automatically linked. You can also write an explicit link with `[[Neverwinter]]` or `[[Neverwinter|the city]]`.

## Editing
Open an article and select **Edit article**. New entries can be created from **New entry**. Changes are saved as local drafts first; publishing to GitHub requires an authorized editor's credential.

## Images
Editors can attach or replace images and insert them directly into an article. Images are stored with the project when the changes are published.

## A spoiler-safe book
Unrevealed lore and DM plans do **not** belong in this public archive.''',facts=facts(Access='Public read / authorized edit'),icon='✎')
root=Path(__file__).resolve().parent.parent
(root/'data'/'pages.json').write_text(json.dumps({'schema':1,'siteName':'Daughter of the Moon Wiki','pages':p},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Created',len(p),'starter articles')
