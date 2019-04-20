---
title: SimpleHash
layout: default
---

<style>
tr th:first-child {
  width: 150px;
}
tr th:nth-child(4),
tr th:nth-child(5),
tr th:last-child {
  width: 100px;
}

@media (max-width: 800px) {
  table {
    display: block;
    overflow: auto;
    width: 100%;
  }
}
</style>

**edit** not sure about this anymore, I would rather inherint from Hash and lost the "indifferent access", also making it read-only allows to use `define_method` which is nice.

you know `Struct`, `Hash`, `OpenStruct`, `HashWithIndifferentAccess`, [your custom classes], etc. what if there was a better way, one key-value class that would combine the best of all worlds?

I would call it `SimpleHash` and here is how I would use it:

```ruby
user = SimpleHash[name: "localhostdotdev", writing?: true]
user.name # => "localhostdotdev"
user.writing? # => true
user[:name] # => "localhostdotdev"
user["name"] # => "lcoalhostdotev"
user.namme # => NoMethodError, did you mean? name
user.try(:nammmes) # => nil
user.keys # => [:name, :writing?]
user.values # => ["localhostdotdev", true]

# what about that?
user = SimpleHash[emails: [{ domain: "localhost.dev" }]]
user.emails.first.domain # "localhost.dev"
```

sounds cool?

let's review how exisiting solutions compare:

| | Struct | Hash | OpenStruct | HashWithIndifferentAccess | [your custom class] | SimpleHash |
|-----------------------:|:------:|:----:|:----------:|:-------------------------:|:-------------------:|:----------:|
| simple name | ✓ | ✓ | ✓ | ✗ | ? | ✓ |
| `new({ a: 1 })` / `[a: 1]` | ✗ | ✓ | ✓ | ✓ | ? | ✓ |
| `.name` / `.writing?` | ✓ | ✗ | ✓ | ✗ | ? | ✓ |
| `[:name]` | ✓ | ✓ | ✓ | ✓ | ? | ✓ |
| `[:name]` / `["name"]` | ✓ | ✗ | ✓ | ✓ | ? | ✓ |
| `.keys` / `.values` / etc. | ✗ | ✓ | ✗ | ✓ | ? | ✓ |
| `NoMethodError` | ✓ | ✓ | ✗ | ✓ | ? | ✓ |
| did you mean | ✓ | ✗ | ✗ | ✗ | ? | ✓ |
| `.to_json` | ✓ | ✓ | ✗ | ✓ | ? | ✓ |
| `.emails.first.domain` | ✗ | ✗ | ✗ | ✗ | ? | ✓ |

[source](https://gist.github.com/localhostdotdev/e6b5470b4e1a63394f8f30bb35b0d8ed)

[thanks to this markdown table generator](https://www.tablesgenerator.com/markdown_tables)

disclaimer: I wrote many hacks around those in the past

what about having it today?

```ruby
class SimpleHash < HashWithIndifferentAccess
  def method_missing(method_name, *args, &block)
    if keys.include?(method_name.to_s)
      if args.empty? && block.nil?
        send(:simple_fetch, method_name)
      else
        raise "can't pass arguments and/or blocks"
      end
    else
      super
    end
  end

  def respond_to_missing?(method_name, include_private = false)
    keys.include?(method_name.to_s) || super
  end

  def methods
    super + keys
  end

  def simple_fetch(key)
    simple_convert(fetch(key))
  end

  private

  def simple_convert(value)
    if value.is_a?(Hash)
      SimpleHash[value].freeze
    elsif value.is_a?(Array)
      value.map { |val| convert(val) }
    else
      value
    end
  end
end
```

(I don't think I could claim of license / patent on this, but just in case let's say it's MIT license)

and a little bonus, an active model serializer for rails:

```ruby
class SimpleHashSerializer
  def self.dump(simple_hash)
    return if simple_hash.nil?
    simple_hash.to_h
  end

  def self.load(hash)
    return if hash.nil?
    SimpleHash[hash]
  end
end

class User < ApplicationRecord
  serialize :settings, SimpleHashSerializer
end

User.last.settings.notifications.email?
```

- some people won't like the deep conversion
- some people would like the deep conversion to happen on [] / fetch calls etc. (e.g. internal data is deep converted)
- some people won't like the indifferent access
- some people won't like the `method_missing` (`define_method` would need to stay in sync with the keys)
- some people won't like depending on activesupport`
- some people want `.new(name: "something")` (me too)
- some people want good class names (I did that but removed it)
- some people will say it's slow (not my bottleneck at least)
- and maybe some people will like it :)
- if you find bugs, I would be very happy to fix them (as I use this in real code and all my tests are green)

-------

**edit 1**

[two](https://www.reddit.com/r/ruby/comments/bf5iq9/simplehash/elbl5uf/) [people](https://discord.gg) mentionned [hashie](https://github.com/intridea/hashie).

```ruby
$hashie.name # => "localhostdotdev"
$hashie.keys # => ["name", "writing?"]
$hashie[:name] # => "localhostdotdev"
$hashie["name"] # => "localhostdotdev"
$hashie.names # => nil
$hashie.to_json # => "{\"name\":\"localhostdotdev\",\"writing?\":true}"
$hashie.emails.first.domain # => "localhost.dev"
```

so pretty close except but it's not raising NoMethodError (like OpenStruct).

**edit 2**

[someone](https://lobste.rs/s/rkxpjb/simplehash#c_wl1gth) mentionned write access which I didn't think much about because it's mostly read-only in my use case.

```ruby
user = SimpleHash[name: "a"]
user[:name] = { prefix: "a", suffix: "b" }
user.name.prefix # => "a"

hash = SimpleHash[a: { deep: { key: [:with, :an, :array] } }]
hash[:a][:deep][:key] += [:and, :more]
hash # => {"a"=>{"deep"=>{"key"=>[:with, :an, :array, :and, :more]}}}
```

so works fine except it doesn't do `hash.a.deep.key += [:and, :more]` which is on purpose as my use case is mostly read only so writes have to be very explicit.

**edit 3**

thanks to electrostat for [the bug report](https://www.reddit.com/r/ruby/comments/bf5iq9/simplehash/elculhf/), doing `user.emails.first.merge!(domain2: 'google.com')` would be misleading since the original SimpleHash would not change.

I updated the code so that the converted hashes are frozen and this will raise `FrozenError (can't modify frozen SimpleHash)`.

the recommended way to do this is `user[:emails].first.merge!(domain3: 'example.com')`

(I should add "I can fix the bugs" to the comparaison table :) )

-------

[source of this page on github](https://github.com/localhostdotdev/localhostdotdev.github.io/blob/master/simple_hash.md)

[comments on reddit /r/ruby](https://www.reddit.com/r/ruby/comments/bf5iq9/simplehash/)

[comments on lobsters](https://lobste.rs/s/rkxpjb/simplehash)
