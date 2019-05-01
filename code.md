---
title: bits of code i liked
layout: default
---

> f1(x1) = y1

> f1(f2(x1)) = Y(f1, f2)(x1) = y1

> f1(f2(x1, x2, ..., xn)) = Y(f1, f2)(x1, x2, ..., xn) = (y1, y2, ..., yn)

> Y(f1, f2, ..., fn)(x1, x2, ..., xn) = (y1, y2, ..., yn)

```ruby
def Y(*f)
  lambda do |*x|
    f.reduce(x) do |x, fi|
      x.map do |xi|
        fi.(xi)
      end
    end
  end
end
```
