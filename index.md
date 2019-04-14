---
layout: default
title: pages
---

<ul>
{% for page in site.pages %}
  {% if page.url != "/" and page.url != "/404/" and page.layout == "default" %}
    <li><a href="{{ page.url }}">{{ page.title }}</a></li>
  {% endif %}
{% endfor %}
</ul>
