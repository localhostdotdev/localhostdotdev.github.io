---
layout: default
title: pages
---

<ul>
{% for page in site.pages %}
  {% unless page.url == "/" %}
    <li><a href="{{ page.url }}">{{ page.title }}</a></li>
  {% endunless %}
{% endfor %}
</ul>
