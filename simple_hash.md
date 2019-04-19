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

you know `Struct`, `Hash`, `OpenStruct`, `HashWithIndifferentAccess`, [your custom classes], etc. what if there was a better way, one key-value class that would combine the best of all worlds?

I call it `SimpleHash` and here is how I would use it:

```ruby
me = SimpleHash[name: "localhostdotdev", writing?: true]
me.name # => localhostdotdev
me.writing? # => true
me[:name] # => localhostdotdev
me["name"] # => lcoalhostdotev
me.namme # => NoMethodError, did you mean? name
me.try(:nammmes) # => nil
me.keys # => [:name, :writing?]
me.values # => ["localhostdotdev", true]

# what about that?
user = SimpleHash[emails: [{ domain: "localhost.dev" }]]
user.emails.first.domain # localhost.dev
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
| i like it a lot | ✗ | ✗ | ✗ | ✗ | ? | ✓ |

[source](https://gist.github.com/localhostdotdev/e6b5470b4e1a63394f8f30bb35b0d8ed)

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
    convert(fetch(key))
  end

  private

  def convert(value)
    if value.is_a?(Hash)
      SimpleHash[value]
    elsif value.is_a?(Array)
      value.map { |value| convert(value) }
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

class User
  serialize :settings, SimpleHashSerializer
end
```

- some people won't like the deep conversion
- some people won't like the indifferent access
- some people won't like the `method_missing` (`define_method` would need to stay in sync with the keys)
- some people won't like depending on activesupport`
- some people want `.new(name: "something")` (me too)
- some people want good class names (I did that but removed it)
- some people will say it's slow (not my bottleneck at least)
- and maybe some people will like it :)
