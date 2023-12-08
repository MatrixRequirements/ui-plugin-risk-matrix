interface IRiskGraph {
    category: string; // risk category
    w1: string; // weight x axis
    w2: string; // weight y axis
    ba: string, // before or after
    displayOptions: string  // option to render
}

/***** start add possibility to configure combinations of axis, e.g. p1xp2 vs s  */
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

interface IRenderContent {
    html:string,
    riskCount:number
}
interface IResolvedWeights {
    xWeights:string [];
    yWeights:string[];
    xCombination:IRiskCombination;
    yCombination:IRiskCombination;
}

/***** end add possibility to configure combinations of axis, e.g. p1xp2 vs s  */
            
// item id -> risk value
interface IStringRiskMap {[key:string]:RiskCalculator}

// eslint-disable-next-line no-unused-vars
namespace UiPluginRiskMatrix {
    export class RiskGraphPage {
        private properties:JQuery;
        private graph:JQuery;

        constructor() {
            // left empty for lint
        }

        getDashboardDOM(): JQuery {
           return  $("<div  style='margin:10px;' class='panel-body-v-scroll fillHeight' >");
        }

        renderProjectPage() {

            const control = this.getDashboardDOM();
            app.itemForm.append(
                ml.UI.getPageTitle(
                    "Risk Matrices",
                    () => {
                        return control;
                    },
                    () => {
                        this.onResize();
                    }
                )
            );
            app.itemForm.append(control);
            this.selectCategory(control);
        }

        onResize() {
            console.log("onresize has been triggered... ");
        }
    
        // ask for risk category if there's multiple
        private selectCategory(ui: JQuery) {
            const that = this;
            const riskCats = IC.getCategories(true).filter(category => IC.getFieldsOfType("risk2", category).length != 0);
            const options: IRiskGraph = {
                category: riskCats.length == 1 ? riskCats[0] : "",
                w1: "",
                w2: "",
                ba: "",
                displayOptions: ""
            };

            ml.UI.addDropdownToValue(ui, "Select Risk Category", options, "category", riskCats.map((cat) => { return { id: cat, label: cat } }), false,
                false, () => that.selectProperties(options));
            this.properties = $("<div>").appendTo(ui);
            this.graph = $("<div style='margin:10px'>").appendTo(ui);
            if (riskCats.length == 1) {
                this.selectProperties(options);
            }
        }

        // ask for graph configuration
        private selectProperties(options: IRiskGraph) {
            const that = this;

            this.properties.html("");
            
            this.graph.html("");
            // get config (either fields setting, or as fallback project setting)
            const field = IC.getFieldsOfType("risk2", options.category)[0].field;
            let config = <IRiskWithCombinations>field.parameterJson.riskConfig;
            if (!config) {
                config = <IRiskWithCombinations>IC.getRiskConfig();
            }

            // get weights from configuration
            const weights: IDropdownOption[] = [];
            for (const factor of config.factors) {
                for (const weight of factor.weights) {
                    weights.push({ id: weight.type, label: weight.type + " - " + weight.label, class:"weight" });
                }
            }
            if (weights.length < 2) {
                this.properties.html("There need to be at least 2 weights to show a risk matrix.");
                return;
            }

            // add combined axis from configuration (e.g. p1xp2)
            for( const combination of config.combinations??[]) {
                if (weights.map(dd => dd.id).indexOf(combination.id) !=-1) {
                    this.properties.html("There is a combination with same id as a weight type.");
                    return;
                }
                weights.push( { id: combination.id, label:combination.name, class: "combined weights" })
            }
 

            // before after
            const beforeAfter = [{ id: "before", label: "before controls" }, { id: "after", label: "after controls" }];

            // display options
            const displayOptions = [{ id: "count", label: "number of items" }, { id: "ids", label: "list ids" }, { id: "idsc", label: "list ids (compact)" }, { id: "idts", label: "list ids with title" }, { id: "text", label: "text" }, { id: "empty", label: "empty" }];

            // define initial selected options from drop downs
            options.w1 = weights[0].id;
            options.w2 = weights[1].id,
            options.ba = "before";
            options.displayOptions = "count";

            // drop down to select x and y axis
            const axis = $("<div>").appendTo( this.properties );
            that.updateAxisSelect( axis, config, options, weights);

            ml.UI.addDropdownToValue(this.properties, "Before or after", options, "ba", beforeAfter, false, false, () => { });
            ml.UI.addDropdownToValue(this.properties, "Display", options, "displayOptions", displayOptions, false, false, () => { });

            $("<button title class='btn btn-success hidden-print'>Render Risk Matrix</button>")
                .appendTo(this.properties)
                .click(function () {
                    app.searchAsync(`mrql:category=${options.category}`, null, true, "" + field.id).done((risks) => {
                        that.renderMatrices(options, config, risks);
                    });
                });
        }

        /** render drop downs to select axis. if a drop down changes, update the options to exclude the selected */
        private updateAxisSelect( axis:JQuery, config:IRiskWithCombinations,options:IRiskGraph, weights:IDropdownOption[]) {
            const that = this;

            const resolved = this.getResolvedWeights(config,options);

            axis.html("");
            ml.UI.addDropdownToValue(axis, "Select Horizontal Axis", options, "w1", weights.filter( w => w.id != options.w2 && resolved.yWeights.indexOf( w.id )==-1), false, false, () => { that.updateAxisSelect( axis, config, options, weights);});
            ml.UI.addDropdownToValue(axis, "Select Vertical Axis", options, "w2", weights.filter( w => w.id != options.w1 && resolved.xWeights.indexOf( w.id )==-1), false, false,  () => { that.updateAxisSelect( axis, config, options, weights);});
        }

        /** get weights and combination of weights used in each axis */
        private getResolvedWeights(config:IRiskWithCombinations, options:IRiskGraph):IResolvedWeights {
            const resolved:IResolvedWeights = {
                xWeights:[],
                yWeights:[],
                xCombination:null,
                yCombination:null
            }
            for( const combination of config.combinations??[]) {
                if ( combination.id == options.w1  ) {
                    resolved.xWeights =  combination.weightIds;
                    resolved.xCombination = combination;
                }
                if ( combination.id == options.w2  ) {
                    resolved.yWeights =  combination.weightIds;          
                    resolved.yCombination = combination;
                }
            }
            if (resolved.xWeights.length == 0) {
                resolved.xWeights.push(options.w1);
            }
            if (resolved.yWeights.length == 0) {
                resolved.yWeights.push(options.w2);
            }
            return resolved;
        }

        // render risk matrices (there can be multiple if not all axis have been selected)
        private renderMatrices( options: IRiskGraph, config: IRiskWithCombinations, search: ISearchResult[]) {
            this.graph.html("");
            
            const resolved = this.getResolvedWeights( config, options);
 
            const heading = $("<h2>Risk Distribution <span id='totalRenderedRisks'></span></h2>").appendTo(this.graph);
            const canvas = $("<div>").appendTo(this.graph);
            ml.UI.copyBuffer(heading, "copy to clipboard", canvas, canvas, ( copied:JQuery) => {
                $.each( $(".macro", copied), (i,m) => { $(m).replaceWith( $(".highLink",$(m)).text() + "!" )});
            });

            // build a list of permutations of values not on the axises
            let permutations:IRiskValueMap[] = [{}];
            for (const factor of config.factors) {
                for (const weight of factor.weights) {
                    if (resolved.xWeights.indexOf(weight.type)==-1 && resolved.yWeights.indexOf(weight.type)==-1 ) {
                        const nextLevelPermutation :IRiskValueMap[] = [];
                        for (const val of weight.values) {
                            for (const permutation of permutations) {
                                permutation[weight.type]=val.factor;
                                nextLevelPermutation.push( JSON.parse(JSON.stringify(permutation)));
                            }
                        }
                        permutations = nextLevelPermutation;
                    }
                }
            }

            let totalRenderedRisks = 0;
            for (const permutation of permutations) {
                totalRenderedRisks += this.renderMatrix(canvas, options, resolved, permutation, config, search);
            }
            $("#totalRenderedRisks").html(`(rendered ${totalRenderedRisks} of ${search.length} risks)`);
            if (options.displayOptions=="idts") {
                canvas.highlightReferences();
            }
        }

        // render both axis for one x and y axis as selected, with one permutation of other weights (if there's any)
        private renderMatrix(canvas:JQuery, options: IRiskGraph, resolved:IResolvedWeights, permutation:IRiskValueMap, config: IRiskConfig, search: ISearchResult[]) {

             // get risk objects
            const risks:IStringRiskMap = this.getRisks( search, config);

            const riskCalculator = new RiskCalculator(config);
            riskCalculator.parse("");
            const baseRisk = riskCalculator.getValue();

            this.logRiskFilter( "Initial Base Risk", baseRisk, config);

            // add missing factors
            if (app.getVersion().indexOf("2.3.")==0) {
                // this is done automatically in 2.4
                for (const factor of config.factors) {
                    const baseFactor = baseRisk.factors.filter( f => f.type == factor.type);
                    if (baseFactor.length==0) {
                        const newFactor = { type: factor.type, weights: [], label: "", value: "" };
                        baseRisk.factors.push(newFactor);
                        baseFactor.push(newFactor);
                    }
                    for (const weight of factor.weights) {
                        const baseWeight = baseFactor[0].weights.filter( w => w.type == weight.type);
                
                        if (baseWeight.length==0) {
                            baseFactor[0].weights.push({ type: weight.type, value: weight.values[0].factor, description: "", label: "" });
                        }
                    }
                }
            }

            // set other values (not on axis if there's more than two axis) 
            const otherExplanation =$("<div>");
            for ( const wv of Object.keys( permutation)) {
                this.setDummyRisk( baseRisk, wv, Number( permutation[wv]));
                if (resolved.yWeights.indexOf( wv ) ==-1 && resolved.xWeights.indexOf( wv ) ==-1) {
                    otherExplanation.append( `<div>${this.getWeightLabel( wv, config)}: ${ permutation[wv]} - ${ this.getWeightText( wv, permutation[wv], config)} </div>`)
                }
            }

            this.logRiskFilter( "Permuted Base Risk", baseRisk, config);
            
            // get the definitions of the two axis to be able to enumerate over values
            let xAxis: IRiskConfigFactorWeight;
            let yAxis: IRiskConfigFactorWeight;
            for (const factor of config.factors) {
                for (const weight of factor.weights) {
                    if (options.w1 == weight.type) {
                        xAxis = weight;
                    }
                    if (options.w2 == weight.type) {
                        yAxis = weight;
                    }
                }
            } 
            
            // header row -> x axis
            canvas.append(otherExplanation);
            let table = `<table class="table table-bordered">`;
            table += `<thead><tr><th rowspan=2>${resolved.yCombination?resolved.yCombination.name:yAxis.label}</th><th colspan=${resolved.xCombination?resolved.xCombination.combinedWeights.length:xAxis.values.length}>${resolved.xCombination?resolved.xCombination.name:xAxis.label}</th></tr><tr>`;
            for (const x of xAxis?xAxis.values:[]) {
                table += `<th>${x.factor} ${x.shortname}</th>`;
            }
            for (const x of resolved.xCombination?resolved.xCombination.combinedWeights:[]) {
                table += `<th>${x.name}</th>`;
            }
            table += `</tr></thead>`;
            // counts
            table += `</tbody>`;
            const render:IRenderContent =  this.renderRows( baseRisk, riskCalculator, options, resolved.xCombination, resolved.yCombination, xAxis, yAxis, risks, config);
            
            table += render.html;

            table += `</tbody></table>`;

            canvas.append(table);

            return render.riskCount;
        }

        private renderRows(baseRisk:IRiskValue,  riskCalculator:RiskCalculator, options: IRiskGraph, xCombination:IRiskCombination, yCombination:IRiskCombination, xAxis: IRiskConfigFactorWeight, yAxis:IRiskConfigFactorWeight, risks:IStringRiskMap, config:IRiskConfig) {
            const tableRows:IRenderContent = { html:"", riskCount:0};

            if (yCombination) {
                for (const y of  yCombination.combinedWeights) { 
                    tableRows.html += `<tr><td><b>${y.name}</b></td>`;
                    const rowColumns = this.renderColumns( y, undefined, baseRisk, riskCalculator, options, xCombination, xAxis, yAxis, risks, config);
                    tableRows.html += rowColumns.html;
                    tableRows.riskCount += rowColumns.riskCount;
                    tableRows.html += `</tr>`;     
                }
            } else {
                for (const y of yAxis.values) {
                    tableRows.html += `<tr><td><b>${y.factor} ${y.shortname}</b></td>`;
                    const rowColumns = this.renderColumns( undefined, y, baseRisk, riskCalculator, options, xCombination, xAxis, yAxis, risks, config);
                    tableRows.html += rowColumns.html;
                    tableRows.riskCount += rowColumns.riskCount;
                    tableRows.html += `</tr>`;  
                }
            }
            return tableRows;
        }
        
        private renderColumns( combinationRow:IRiskCombinedWeight, propertyRow:IRiskConfigFactorWeightValue, baseRisk:IRiskValue, riskCalculator:RiskCalculator, 
            options: IRiskGraph, xCombination:IRiskCombination, xAxis: IRiskConfigFactorWeight, yAxis:IRiskConfigFactorWeight,  risks:IStringRiskMap, config:IRiskConfig) {
          
            const cell :IRenderContent = { html:"", riskCount:0};

            if (xCombination) {
                for (const x of  xCombination.combinedWeights) { 
                    const renderCell = this.renderCell( combinationRow, propertyRow, x, undefined,  baseRisk, riskCalculator, options, xAxis, yAxis, risks, config);
                    cell.html += renderCell.html;
                    cell.riskCount += renderCell.riskCount;
                }
            } else {
                for (const x of xAxis.values) {
                    const renderCell = this.renderCell( combinationRow, propertyRow, undefined, x ,baseRisk,riskCalculator, options, xAxis, yAxis, risks, config);
                    cell.html += renderCell.html;
                    cell.riskCount += renderCell.riskCount;
                }
            }
            return cell;
        }

        private logRiskFilter( text:string, baseRisk:IRiskValue, config:IRiskConfig) {
            let msg = text + ":";
            for (const factor of config.factors) {
                const baseFactor = baseRisk.factors.filter( f => f.type == factor.type);
                if (baseFactor.length==1) {
                    for (const weight of factor.weights) {
                        const baseWeight = baseFactor[0].weights.filter( w => w.type == weight.type);
                
                        if (baseWeight.length==1) {
                            msg += ` ${weight.type}:${baseWeight[0].value}`;
                        }
                    }
                }
            }
            console.log( msg );
        }
        private renderCell(combinationRow:IRiskCombinedWeight, propertyRow:IRiskConfigFactorWeightValue,combinationColumn:IRiskCombinedWeight, propertyColumn:IRiskConfigFactorWeightValue,baseRisk:IRiskValue, riskCalculator:RiskCalculator,
            options: IRiskGraph,   xAxis: IRiskConfigFactorWeight, yAxis:IRiskConfigFactorWeight, risks:IStringRiskMap, config:IRiskConfig) {
            
            // this enumerates all the risks with given combinations of weights -> as a side effect, the baseRisk will updated to match the risk in that cell
            // if there are several dimensions in a cell, the base risk will be the last 'dimension'
            const risksInCell = this.getRiskIdsXY( combinationRow, propertyRow,combinationColumn, propertyColumn, baseRisk, riskCalculator, options,   xAxis, yAxis, risks, config);
            
            let text = "";
            
            this.logRiskFilter( "Last Base Risk", baseRisk, config);

            riskCalculator.init(baseRisk);
            let color =  riskCalculator.getAttributeHTML("colorbeforebackground"); // random if one column is a combination of weights

            if ( combinationColumn && combinationColumn.colors && yAxis && yAxis.type && propertyRow && propertyRow.factor && combinationColumn.colors[ yAxis.type ] ) {
                color = combinationColumn.colors[ yAxis.type ][propertyRow.factor]
            }
            if ( combinationRow && combinationRow.colors && xAxis && xAxis.type && propertyColumn && propertyColumn.factor && combinationRow.colors[ xAxis.type ] ) {
                color = combinationRow.colors[ xAxis.type ][propertyColumn.factor]
            }
            


            if ( options.displayOptions == "text" ) {
                let total = $(riskCalculator.getAttributeHTML(options.ba=="before"?"totalrbm":"totalram")).text(); // random if one column is a combination of weights
                
                if ( combinationColumn && combinationColumn[options.ba] && yAxis && yAxis.type && propertyRow && propertyRow.factor && combinationColumn[options.ba][ yAxis.type ] && combinationColumn[options.ba][ yAxis.type ][propertyRow.factor]) {
                    total = combinationColumn[options.ba][ yAxis.type ][propertyRow.factor];
                }
                if ( combinationRow && combinationRow[options.ba] && xAxis && xAxis.type && propertyColumn && propertyColumn.factor && combinationRow[options.ba][ xAxis.type ] && combinationRow[options.ba][ xAxis.type ][propertyColumn.factor]) {
                    total = combinationRow[options.ba][ xAxis.type ][propertyColumn.factor];
                }

                text += total;
            } else if (  options.displayOptions != "empty" ) {
                
                if (  options.displayOptions == "count" ) {
                    text = ""+risksInCell.length;
                } else if ( options.displayOptions == "ids" ) {
                    text = risksInCell.map( id => `<div>${id}</div>`).join("");
                } else if ( options.displayOptions == "idsc" ) {
                    text = risksInCell.map( id => `<span>${id}</span>`).join(", ");
                } else if ( options.displayOptions == "idts" ) {
                    text = risksInCell.map( id => `<div>${id}!</div>`).join("");
                }
            }
            
                
            return { html:`<td style="background-color:${color}">${text}</ts>`, riskCount:risksInCell.length };
        }  

        private getRiskIdsXY(combinationRow:IRiskCombinedWeight, propertyRow:IRiskConfigFactorWeightValue,combinationColumn:IRiskCombinedWeight, propertyColumn:IRiskConfigFactorWeightValue,baseRisk:IRiskValue, riskCalculator:RiskCalculator,
            options: IRiskGraph,   xAxis: IRiskConfigFactorWeight, yAxis:IRiskConfigFactorWeight, risks:IStringRiskMap, config:IRiskConfig) {
            
            let riskIds = [];

            // define what should be counted for this cell
            if (combinationRow) {
                for (const row of combinationRow.weightTuples) {
                    for (const opt of Object.keys( row)) {
                        this.setDummyRisk(baseRisk, opt, row[opt]);
                    }
                    riskIds = riskIds.concat( this.getRiskIdsX(combinationColumn, propertyColumn, baseRisk, riskCalculator, options, xAxis, risks, config) );
                }
            } else {
                this.setDummyRisk(baseRisk, yAxis.type, propertyRow.factor);  
                riskIds = riskIds.concat( this.getRiskIdsX(combinationColumn, propertyColumn, baseRisk, riskCalculator, options, xAxis, risks, config) );
            }

            return riskIds;
        }

        private getRiskIdsX( combinationColumn:IRiskCombinedWeight, propertyColumn:IRiskConfigFactorWeightValue,baseRisk:IRiskValue, riskCalculator:RiskCalculator,
            options: IRiskGraph,   xAxis: IRiskConfigFactorWeight,  risks:IStringRiskMap, config:IRiskConfig) {
            
            let riskIds = [];

            // define what should be counted for this cell
            if (combinationColumn) {
                for (const col of combinationColumn.weightTuples) {
                    for (const opt of Object.keys( col )) {
                        this.setDummyRisk(baseRisk, opt, col[opt]);
                    }
                    riskIds = riskIds.concat( this.getRiskIds(baseRisk, riskCalculator, options, risks, config) );
                }
            } else {
                this.setDummyRisk(baseRisk, xAxis.type, propertyColumn.factor);  
                riskIds = riskIds.concat( this.getRiskIds(baseRisk, riskCalculator, options, risks, config) );
            }

            return riskIds;
        }
        
        private getRiskIds( baseRisk:IRiskValue,  riskCalculator:RiskCalculator, options: IRiskGraph, risks:IStringRiskMap, config:IRiskConfig) {
    
            this.logRiskFilter( "Cell Base Risk", baseRisk, config);

            riskCalculator.init(baseRisk);
            return this.getFilteredRisks( risks, baseRisk, options);
        }
             
                   
              
        private getWeightLabel( id:string, config:IRiskConfig) {
            for (const factor of config.factors) {
                for (const weight of factor.weights) {
                    if (id == weight.type) {
                        return weight.label;
                    }
                }
            }
            return id;
        }
        
        private getWeightText( id:string, val:number, config:IRiskConfig) {
            for (const factor of config.factors) {
                for (const weight of factor.weights) {
                    if (id == weight.type) {
                        for (const vals of weight.values) {
                            if ( vals.factor == val) {
                                return weight.label;
                            }
                        }
                    }
                }
            }
            return "";
        }
        
        // create a dummy risk which has some given values
        private setDummyRisk(baseRisk: IRiskValue, weightType: string, weightValue: number) {
            for (const factor of baseRisk.factors) {
                for (const weight of factor.weights) {
                    if (weight.type == weightType) {
                        weight.value = weightValue;
                    }
                }
            }
        }

        // convert all the risks (updating the mitigations)
        private getRisks( search:ISearchResult[] , config:IRiskConfig) {
            // get all possible mitigations
            let mitigations:IReference[]=[]; 
            for (const mit of config.mitigationTypes) {
                const itemsInCat = app.getChildrenIdsRec( "F-" + mit.type + "-1").map( (id) => {return { to:id, title:""}});
                mitigations = mitigations.concat( itemsInCat );
            }

            const riskValues:IStringRiskMap = {}
            
            for (const s of search) {
                const rc = new RiskCalculator(config);
                rc.parse( s.fieldVal[0].value );
                rc.updateMitigations( mitigations );
                riskValues[s.itemId] = rc;
            }
            return riskValues;
        }

        // get risks with given weights

        private getFilteredRisks( risks:IStringRiskMap, baseRisk:IRiskValue, options:IRiskGraph) {
            const ids = [];
        
            for (const riskItem of Object.keys( risks)) {
                let selected = true;
                const rc = risks[riskItem];
                const values = options.ba=="before"?rc.getRBM():rc.getRAM(rc.getRBM());
                for (const factor of baseRisk.factors) {
                    for (const weight of factor.weights) {
                        if ( values[weight.type] != weight.value ) {
                            selected = false;
                        }
                    }
                }
                if (selected) {
                    ids.push( riskItem )
                }
            }
            return ids;
        }
    }
    
}
