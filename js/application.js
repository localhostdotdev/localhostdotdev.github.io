document.querySelectorAll('td').forEach(function(td) {
  if (td.innerText == "?") {
    td.style.color = "blue"
  } else if (td.innerText == "✓") {
    td.style.color = "green"
  } else if (td.innerText == "✗") {
    td.style.color = "red"
  }
})
