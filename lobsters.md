---
title: quick scan through lobsters's source code
layout: default
---

I started using lobsters after hearing it for a long while (never used my first account). and I've been a long time HN and reddit user (like most people there I guess).

I find it quite amazing already, so let's dive deep into the source to see what's going on there.

a few links one could find helpful:

- [github.com/lobsters/lobsters](https://github.com/lobsters/lobsters)
- [lobste.rs](https://lobste.rs)
- [https://lobste.rs/about](lobste.rs/about)
- **[db/schema.rb](https://github.com/lobsters/lobsters/blob/master/db/schema.rb)**
- **[Gemfile](https://github.com/lobsters/lobsters/blob/master/Gemfile)**
- **[config/routes.rb](https://github.com/lobsters/lobsters/blob/master/config/routes.rb)**

I've been using rails since 2.3 so I do know it well, but ~~probably~~ not as well as well as pushcx (admin/moderator/main current contributor, ~2017-2019) and jcs (lobsters creator, contributor ~2012-2017).

here is some interesting bits that I found (**to the best of my understanding**):

- replies on stories with negative comments are not shown ([source](https://github.com/lobsters/lobsters/commit/02ed8c3783ca4d602cbfcc39d6df7dedd0460bc1))
- the comments about "enabling postgresql" are a lie :) (schema + search depends on mysql at least)
- usernames are limited to 25 characters, alphanumeric start + (alphanumeric _ -) (ascii) ([source](https://github.com/lobsters/lobsters/blob/master/app/models/user.rb#L78-L80))
- there is a list of banned usernames like admin/moderator/root/etc. :) ([source](https://github.com/lobsters/lobsters/blob/master/app/models/user.rb#L103-L106))
-  7 days for "new" users, 10 karma to suggest title/tags, 50 karma to downvote, -4 karma to submit stories/invations, 51% of posts from you = "heavy self promoter" (at least 2 stories), ([source](https://github.com/lobsters/lobsters/blob/master/app/models/user.rb#L108-L127))
- markdown is a custom parser based on nokogiri on top of [commonmarker](https://github.com/gjtorikian/commonmarker) that follows the CommonMark spec + github flavored markdown ([source](https://github.com/lobsters/lobsters/blob/master/extras/markdowner.rb)):
  - h1, h2, etc. are converted to bold (so good)
  - images to links to the image (expect moderators :) ([source](https://github.com/lobsters/lobsters/commit/efe350581144019f25c8e69d826f14bc6e66ae08))) (alt of the image is used for the text of the link if provided)
  - nofollow for links
  - @username are auto-linked to the user's profile on lobsters
- IP adresses (linked to user id/username/url) are logged on login, sending requests, and when fetching urls (sent in the User-Agent header) ([source](https://github.com/lobsters/lobsters/search?q=remote_ip&unscoped_q=remote_ip)) (also on upvotes it seems ([source](https://github.com/lobsters/lobsters/commit/0cea4d497cb5f86a8b623c880c650524b44b4255))) (not sure what HN logs but reddit uses a lot of analytics BTW)
  - [This is the Internet, you have no privacy.](https://lobste.rs/privacy)
- there is a bunch of mod-only urls (e.g. /mod\*) (on top of all the mod actions obviously) ([source](https://github.com/lobsters/lobsters/blob/d2963d4b80b47ac9f34bda65154a37cdde0a2174/app/controllers/mod_controller.rb))
- if you post "this!" as a comment, you get a "nope!" ([source](https://github.com/lobsters/lobsters/blob/master/app/models/comment.rb#L50-L74))
  - tldr -> "wow! a blue car!"
  - me too -> plz upvote parent
- plaintext comments are coming ([source](https://github.com/lobsters/lobsters/blob/master/app/models/comment.rb#L415))
- it got something to find people with consistently downvoted comments ([source](https://github.com/lobsters/lobsters/blob/master/app/models/downvoted_commenters.rb))
- users become inactive and can disown past comments [source](https://github.com/lobsters/lobsters/blob/master/app/models/inactive_user.rb)
- [story.rb](https://github.com/lobsters/lobsters/blob/master/app/models/story.rb):
  - does not accept all those annoying tracking domains (t.co, bit.ly, etc.)
  - 14 days to downvote, -5 is minimum, 6 hours to edit, 30 days before resubmitting, 2 users to make suggestion live, hot stories for 22 hours
  - drops a bunch of words like a/an/and/but/in/of/etc. when making url slugs
  - no emojis :sad: (😂)
- there was a "Low Quality" reason for story downvotes that got removed ([source](https://github.com/lobsters/lobsters/blob/master/app/models/vote.rb#L23))

(mostly linking to master mostly because I'm lazy)

thanks to pushcx, jcs and [all the current and past contributors for the amazing work BTW](https://github.com/lobsters/lobsters/graphs/contributors), and to everyone in the lobsters community, quite an amazing prowess.

----

what I was actually looking for:

- all assets are through the asset pipeline
- Gemfile is pretty minimalistic, nothing fancy except the [rotp](https://github.com/mdp/rotp)/[rqrcode](https://github.com/whomwah/rqrcode) security gems
  - [ruumba](https://github.com/ericqweinstein/ruumba), rubocop linting for erb, quite cool
- activity has been quite stable and it has been open to contributors for a quite long time
- issues/PRs are managed (e.g. not abandonned/ignored like most projects)
  - "Issues and PRs are typically reviewed Wednesday and some Thursday mornings"
- "Feature requests are no longer being accepted, unless in the form of a pull request with code." (well said)
- uses jquery/select2 and a bit of JS, nothing crazy, I would say "pragmatic" (no turbolinks)
- long files instead of multiple files are preferred in most cases
- no spring/bootsnap it seems (quite good idea as it's the source of 90% of my rails dev experience frustration)
- seems like every once in a while someone tries to migrate to postgres and "kind of" succeeds but not really (search is the hard part)
- follows the "small controllers, fat models" mantra
- erb for templates
- everything is very minimalistic, pragmatic, simple in general
- looks like some BSD/MIT license but doesn't have a name (I think it's a 3 licenses thing)
- processing done with cron ([source](https://github.com/lobsters/lobsters-ansible/tree/master/roles/lobsters/templates/sbin))
- has [ansible](https://github.com/lobsters/lobsters-ansible) and [docker](https://github.com/utensils/docker-lobsters) setups
  - mariadb actually :)
  - on xen on prgmr.com
  - postfix for mails, nginx, tarsnap, unicorn, a funny [vimrc](https://github.com/lobsters/lobsters-ansible/blob/master/roles/sysadm/templates/dot%2Ca/vimrc)
- ruby 2.3 (just got EOL, trying to make nokogiri build, green tests, then posting a PR..., erf I would need mariadb/mysql for that)
  - most gems are close to latest
  - bundle-audit, nothing
  - brakeman has a lot of warnings (mostly false positive, might be worth checking them out though)
- the `validate do ... end` and `... && errors.add` styles are new to me and quite cool I think [link](https://github.com/lobsters/lobsters/blob/master/app/models/comment.rb#L50-L74)
- some html templating in a model, kind of weird[.](https://github.com/lobsters/lobsters/blob/master/app/models/hat.rb)
- `raise "too many hash collisions"` best error yet :)
- seems like sqlite was also supported at some point [source](https://github.com/lobsters/lobsters/blob/master/app/models/keystore.rb)
- formatting is pretty consistent with community guidelines (e.g. it's using rubocop + pragmatic spacing)
- consistent hash rocket syntax, a little pet peeve of mine :)
- search is based on some `MATCH` (mysql-specific)
- no redis cache / in-memory cache (except memoizing) (e.g. no Rails.cache)
- `has_secure_password` (bcryt)

(where is my "deploy to heroku (and pay $Xk/month)" button :D)

(never though of having a comma in my directory names)

having another web application that is still active and which source code I can almost read in ~2 hours is quite an amazing feat in itself.
