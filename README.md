# Example Dashboard - show risk distribution matrices

This plugin renders a risk distribution matrix

![Example Risk distribution matrix](docs/example_matrix.png?raw=true "2 axis of matrix")

**Requires 2.3.3 (later releases untested)**


## Description

The plugin creates a dashboard which can render information about the risks in the project.

If there are multiple risk categories the user needs to select one category at a time. 
For the category selected the plugin shows 2d matrices (with the selected x and y axis) showing different combinations of probabilities and severities.
Inside each matrix it shows either,
* the number of risks in before or after risk controls
* the ids of risks before or after risk controls
* just the colors or ris priority number 

If there are more than two dimensions it iterates over the values, showing multiple matrices (one for each permutation).

The dashboard can be copied and pasted into a document.

There is also a risk distribution matrix by risk zone in another dashboard

## Code shows

* how to make a project dashboard
* find risk categories
* how to get the risk configuration for a category
* get all the items of a category
* compute the risk before and after risk controls of a risk
* make a dashboard which can be copied and pasted into a DOC'S richtext box