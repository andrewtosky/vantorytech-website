# Example full plan

Builds `site/example/plan.html`, the example full solution plan linked from `site/plan.html`. It names the industry, not a business or person, and says the business is made up.

```
python3 build_example_plan.py
```

- `build_example_plan.py` holds the timeline steps, camera stations and cost lines, and draws the line layout.
- `example-plan-body.html` is the page text. `example-plan.css` is the styling.
- The savings calculator is in `site/assets/example-plan.js` (the site's security rules block inline scripts).

Costs are indicative ranges in AUD excluding GST, based on Australian prices for industrial vision equipment and installation. Update them here when we have supplier quotes.
