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

## combined axis

It is possible add to the risk configuration a *combinations* property in which you define how two or more axis are combined into a new.
This allows for example to combine two probabilities p1 and p2 to be show in one axis against a severity.

combinations is an array of combination. Each consists of

interface IRiskWithCombinations extends IRiskConfig {
    combinations?:IRiskCombination[];
}

interface IRiskCombination { // one axis of graph as combination of 2 or more other weights
    id:string, // unique id of combination (no spaces/special chars), e.g "p1xp2"
    name:string, // display name, e.g. "p1 x p2"
    weightIds:string[], // ids/types of weights to combine, e.g. ["p1", "p2"],
    combinedWeights: IRiskCombinedWeight[] // list of rows/columns to create, e.g. if you have 3 different p1 and 3 p2s, p1xp2 could have 2 rows/columns: low and high
}
interface IRiskCombinedWeight { // one column or row which combines multiple weights tuples
    id:string, // unique id of option, e.g. low
    name:string, // display name of option e.g. "low probability"
    weightTuples: IStringNumberMap[], // e.g. [{p1:1, p2:1}, {p1:2, p1:1}]
    colors:IStringStringMap, // defines color to used depending on the other axis, e.g { "severity" : { "1": "green", "2":"red"} } 
    before:IStringStringMap // defines text to used before risk applying, e.g { "severity" : { "1": "before sev 1 with low probability", "2":"before sev 2 with low probability"} } 
    after:IStringStringMap // defines text to used before risk applying, e.g { "severity" : { "1": "before sev 1 with low probability", "2":"before sev 2 with low probability"} } 
}

interface IStringStringMap { [key:string]: IStringMap}  

## Code shows

* how to make a project dashboard
* find risk categories
* how to get the risk configuration for a category
* get all the items of a category
* compute the risk before and after risk controls of a risk
* make a dashboard which can be copied and pasted into a DOC'S richtext box