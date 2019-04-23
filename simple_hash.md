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

you know `Struct`, `Hash`, `OpenStruct`, `HashWithIndifferentAccess`, [your custom classes], etc. I tried to combine the best of existing solutions into what I call a `SimpleHash`:

```ruby
user = SimpleHash.new(name: "localhostdotdev", writing?: true)
user.name # => "localhostdotdev"
user.writing? # => true
user[:name] # => "localhostdotdev"
user["name"] # => "localhostdotdev"
user.namme # => NoMethodError, did you mean? name
user.try(:nammmes) # => nil
user.keys # => [:name, :writing?]
user.values # => ["localhostdotdev", true]

# what about that?
user = SimpleHash[emails: [{ domain: "localhost.dev" }]]
user.emails.first.domain # "localhost.dev"
```

let's review how exisiting solutions compare:

| | Struct | Hash | OpenStruct | HashWithIndifferentAccess | SimpleHash |
|-----------------------:|:------:|:----:|:----------:|:-------------------------:|:-------------------:|:----------:|
| `new({ a: 1 })` / `[a: 1]` | ✗ | ✓ | ✓ | ✓ | ✓ |
| `.name` / `.writing?` | ✓ | ✗ | ✓ | ✗ | ✓ |
| `[:name]` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `[:name]` / `["name"]` | ✓ | ✗ | ✓ | ✓ | ✓ |
| `.keys` / `.values` / etc. | ✗ | ✓ | ✗ | ✓ | ✓ |
| `NoMethodError` | ✓ | ✓ | ✗ | ✓ | ✓ |
| did you mean | ✓ | ✗ | ✗ | ✗ | ✓ |
| `.to_json` | ✓ | ✓ | ✗ | ✓ | ✓ |
| `.emails.first.domain` | ✗ | ✗ | ✗ | ✗ | ✓ |

so here is what I'm doing (still a work in progress):

```ruby
# https://github.com/rails/rails/blob/master/activesupport/lib/active_support/hash_with_indifferent_access.rb
class SimpleHash < ActiveSupport::HashWithIndifferentAccess
  def method_missing(method_name, *args, &block)
    if keys.map(&:to_s).include?(method_name.to_s) && args.empty? && block.nil?
      fetch(method_name)
    else
      super
    end
  end

  def respond_to_missing?(method_name, include_private = false)
    keys.map(&:to_s).include?(method_name.to_s) || super
  end

  def methods
    super + keys.map(&:to_sym)
  end

  protected

  def convert_value(value, options = {})
    if value.is_a?(Hash)
      SimpleHash.new(value).freeze
    elsif value.is_a?(Array)
      value.map { |val| convert_value(val, options) }
    else
      value
    end
  end
end
```

and active model serializer for rails:

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

**TODO: make it into a gem, restore the credits, explain tradeoffs**

-------

[source of this page on github](https://github.com/localhostdotdev/localhostdotdev.github.io/blob/master/simple_hash.md)

[comments on reddit /r/ruby](https://www.reddit.com/r/ruby/comments/bf5iq9/simplehash/)

[comments on lobsters](https://lobste.rs/s/rkxpjb/simplehash)
