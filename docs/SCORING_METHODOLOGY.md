# Scoring methodology

Rubric `arc-brand-v1`. One hundred factors, ten in each category. Each factor weight inside a category is 1. Category weights for the balanced profile:

| Category | Weight |
|---|---|
| First impression | 12% |
| Name quality | 12% |
| Ticker quality | 12% |
| Meme power | 14% |
| Narrative strength | 12% |
| Originality | 10% |
| Brand identity | 10% |
| Social discovery | 8% |
| Target audience | 6% |
| Risk and trust | 4% |

Other profiles rescale the same factors. Custom weights are normalized to 100. Collision rows are not rewritten when only the weights change.

## How a number is produced

Length, letters, ticker shape, and the fixed major-symbol list are deterministic. Joke, story, and audience factors use written rules on the text the user supplied. A factor without its input is `insufficient` or `unknown` and is left out of the average. It is not stored as zero.

The editorial score is the weighted average of scored factors only. Coverage is the share of rubric weight that was scored. Below 40% coverage the overall number is withheld and the label is “Insufficient information.”

Labels from 9–10 down through “Needs improvement” describe the rubric. They are not a chance of market success.

## Risk direction

Risk factors store severity and quality. Quality is `10 − severity`. A higher severity cannot raise the quality score. Trademark language on a screened company name is a preliminary flag, not a legal opinion.

## What the score does not use

Trading volume, holder counts, and later price are not inputs. A historical record is not raised because the token later traded. Narrative timeliness stays unknown unless the user supplies a date. ARC does not invent a news catalyst.
