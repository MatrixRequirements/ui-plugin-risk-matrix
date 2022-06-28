interface IRiskGraph {
    category: string; // risk category
    w1: string; // weight x axis
    w2: string; // weight y axis
    ba: string, // before or after
    displayOptions: string  // option to render
}

// item id -> risk value
interface IStringRiskMap {[key:string]:RiskCalculator}

// eslint-disable-next-line no-unused-vars
namespace UiPluginRiskMatrix {
    export class DashboardPage {
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
            // get config
            const field = IC.getFieldsOfType("risk2", options.category)[0].field;
            let config = <IRiskConfig>field.parameterJson.riskConfig;
            if (!config) {
                config = IC.getRiskConfig();
            }
            // get weights
            const weights: IDropdownOption[] = [];
            for (const factor of config.factors) {
                for (const weight of factor.weights) {
                    weights.push({ id: weight.type, label: weight.type + " - " + weight.label });
                }
            }
            if (weights.length < 2) {
                this.properties.html("There need to be at least 2 weights to show a risk matrix.");
                return;
            }
            // before after
            const beforeAfter = [{ id: "before", label: "before controls" }, { id: "after", label: "after controls" }];
            // display options
            const displayOptions = [{ id: "count", label: "number of items" }, { id: "ids", label: "list ids" }, { id: "idts", label: "list ids and title" }, { id: "text", label: "text" }, { id: "empty", label: "empty" }];

            options.w1 = weights[0].id;
            options.w2 = weights[1].id,
                options.ba = "before";
            options.displayOptions = "count";

            ml.UI.addDropdownToValue(this.properties, "Select First Axis", options, "w1", weights, false, false, () => { });
            ml.UI.addDropdownToValue(this.properties, "Select Second Axis", options, "w2", weights, false, false, () => {});
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

        // render risk
        private renderMatrices( options: IRiskGraph, config: IRiskConfig, search: ISearchResult[]) {
            this.graph.html("");
            
            const heading = $("<h2>Risk Distribution</h2>").appendTo(this.graph);
            const canvas = $("<div>").appendTo(this.graph);
            ml.UI.copyBuffer(heading, "copy to clipboard", canvas, canvas);
            // build a list of permutations of values not on the axises
            let permutations:IRiskValueMap[] = [{}];
            for (const factor of config.factors) {
                for (const weight of factor.weights) {
                    if (options.w1 != weight.type && options.w2 != weight.type) {
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

            for (const permutation of permutations) {
                this.renderMatrix(canvas, options, permutation, config, search);
            }
        }

        // render both axis for one set of combinations of the other options
        private renderMatrix(canvas:JQuery, options: IRiskGraph, permutation:IRiskValueMap, config: IRiskConfig, search: ISearchResult[]) {


            // get risk objects
            const risks:IStringRiskMap = this.getRisks( search, config);

            const riskCalculator = new RiskCalculator(config);
            riskCalculator.parse("");
            const baseRisk = riskCalculator.getValue();

            // set other values (not on axis if there's more than two axis) 
            const otherExplanation =$("<div>");
            for ( const wv of Object.keys( permutation)) {
                this.setDummyRisk( baseRisk, wv, Number( permutation[wv]));
                if (wv != options.w1 && wv != options.w2) {
                    otherExplanation.append( `<div>${this.getWeightLabel( wv, config)}: ${ permutation[wv]} - ${ this.getWeightText( wv, permutation[wv], config)} </div>`)
                }
            }

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
            //console.log( xAxis  );
            //console.log( yAxis  );
            
            // header row -> x axis
            canvas.append(otherExplanation);
            let table = `<table class="table table-bordered">`;
            table += `<thead><tr><th rowspan=2>${yAxis.label}</th><th colspan=${xAxis.values.length}>${xAxis.label}</th></tr><tr>`;
            for (const x of xAxis.values) {
                table += `<th>${x.factor} ${x.shortname}</th>`;
            }
            table += `<tr></thead>`;
            // counts
            table += `</tbody>`;
            for (const y of yAxis.values) {
                table += `<tr><td><b>${y.factor} ${y.shortname}</b></td>`;
                this.setDummyRisk(baseRisk, yAxis.type, y.factor);
                for (const x of xAxis.values) {
                    this.setDummyRisk(baseRisk, xAxis.type, x.factor);
                    console.log( baseRisk );
                    riskCalculator.init(baseRisk);

                    const color = riskCalculator.getAttributeHTML("colorbeforebackground");
                    let text = "";
                    
                    if ( options.displayOptions == "text" ) {
                        text = $(riskCalculator.getAttributeHTML(options.ba=="before"?"totalrbm":"totalram")).text();
                    } else if (  options.displayOptions != "empty" ) {
                        const risksInCell = this.getFilteredRisks( risks, baseRisk, options);
                        
                        if (  options.displayOptions == "count" ) {
                            text = ""+risksInCell.length;
                        } else if ( options.displayOptions == "ids" ) {
                            text = risksInCell.map( id => `<div>${id}</div>`).join("");
                        } else if ( options.displayOptions == "idts" ) {
                            text = risksInCell.map( id => `<div>${id}!</div>`).join("");
                        }
                    }

                    table += `<td style="background-color:${color}">${text}</ts>`;
                }
                table += `</tr>`;
            }
            table += `</tbody></table>`;

            canvas.append(table);
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
