interface IRiskCounter {
    category:string
}

// eslint-disable-next-line no-unused-vars
namespace UiPluginRiskMatrix {
    export class RiskCountsPage {
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
                    "Risk Counts",
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
            const options: IRiskCounter = {
                category: riskCats.length == 1 ? riskCats[0] : ""
            };

            ml.UI.addDropdownToValue(ui, "Select Risk Category", options, "category", riskCats.map((cat) => { return { id: cat, label: cat } }), false,
                false, () => that.createStats(options));
            this.properties = $("<div>").appendTo(ui);
            this.graph = $("<div style='margin:10px'>").appendTo(ui);
            if (riskCats.length == 1) {
                this.createStats(options);
            }
        }

        // ask for graph configuration
        private createStats(options: IRiskCounter) {
            const that = this;

            this.properties.html("");
            this.graph.html("");
            // get config
            const field = IC.getFieldsOfType("risk2", options.category)[0].field;
            let config = <IRiskConfig>field.parameterJson.riskConfig;
            if (!config) {
                config = IC.getRiskConfig();
            }
           
            app.searchAsync(`mrql:category=${options.category}`, null, true, "" + field.id).done((risks) => {
                that.renderStats(options, config, risks);
            });

        }

        // render risk
        private renderStats( options: IRiskCounter, config: IRiskConfig, search: ISearchResult[]) {
            this.graph.html("");
            
            const isLookup = config.method == "lookup";
          
            const heading = $("<h2>Risk Distribution Stats</h2>").appendTo(this.graph);
            const canvas = $("<div>").appendTo(this.graph);
            

            ml.UI.copyBuffer(heading, "copy to clipboard", canvas, canvas);
            // build a list of permutations of values not on the axises
            let table = `<table class="table table-bordered">`;
            table += `<thead><tr><th colspan=2></th>`;
            
            if (isLookup) {
                for (const x of config.charts) {
                    table += `<th>${x.label}</th>`;
                }
            } else {
                table += `<th>Zone 1</th><th>Zone 2</th><th>Zone 3</th>`;
            }
            table += `<th>Total</th>`;
            table += `</tr></thead>`;
            table += `<body>`;
            table += this.renderTable( options, isLookup, true, config, search);
            table += this.renderTable( options, isLookup, false, config, search);
            table += `</body>`;
            table += `</table>`;
            canvas.append(table);
        }

        // render both axis for one set of combinations of the other options
        private renderTable(options: IRiskCounter, isLookup:boolean, isBefore:boolean, config: IRiskConfig, search: ISearchResult[]) {


            // get risk objects
            const risks:IStringRiskMap = this.getRisks( search, config);
            const total = Object.keys(risks).length;
            
            // total
            let table = `<tr><td rowspan=2>${isBefore?"Before":"After"} Control</td>`;
            table += `<td>No of</td>`;
            
            if (isLookup) {
                for (const x of config.charts) {
                    const ids = this.getFilteredByText( config, risks, isBefore, isLookup, x.zone);
                    table += `<td>${ids.length}</td>`;
                }
            } else {
                table += `<td>${this.getFilteredByText( config, risks, isBefore, isLookup, "riskgreen").length}</td>`;
                table += `<td>${this.getFilteredByText( config,risks, isBefore, isLookup, "riskyellow").length}</td>`;
                table += `<td>${this.getFilteredByText( config,risks, isBefore, isLookup, "riskred").length}</td>`;  
            }
            table += `<td rowspan=2>${total}</td>`;
            table += `</tr>`;
 
            // percent
            table += `<tr>`;
            table += `<td>Risk in %</td>`;
            
            if (isLookup) {
                for (const x of config.charts) {
                    const ids = this.getFilteredByText( config, risks, isBefore, isLookup,  x.zone);
                    table += `<td>${Math.round( 10000*ids.length/total )/100}</td>`;
                }
            } else {
                table += `<td>${Math.round( 10000*this.getFilteredByText( config, risks, isBefore, isLookup, "riskgreen").length/total )/100}</td>`;
                table += `<td>${Math.round( 10000*this.getFilteredByText( config, risks, isBefore, isLookup, "riskyellow").length/total )/100}</td>`;
                table += `<td>${Math.round( 10000*this.getFilteredByText( config, risks, isBefore, isLookup, "riskred").length/total )/100}</td>`;  
            }
    
            table += `</tr>`;
            return table;
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

        private getFilteredByText( config:IRiskConfig, risks:IStringRiskMap, isBefore:boolean, isLookup:boolean, text:string) {
            const ids = [];
        
            for (const riskItem of Object.keys( risks)) {
                const rc = risks[riskItem];
                const values = isBefore?rc.getRBM():rc.getRAM(rc.getRBM());
                const riskEval = isLookup?this.getLookupZone(values, config):rc.getRiskSumText( values ).css;
                if (text==riskEval) {
                    ids.push( riskItem );
                }
            }
            return ids;
        }

        private getLookupZone( riskValues:IRiskValueMap, config:IRiskConfig) {
        
            for ( const rpn of config.rpns) {
                let hit = true;
                for( const factor of config.factors) {
                    for (const weight of factor.weights) {
                        // compare number to string
                        if ( riskValues[weight.type] != rpn[weight.type]) {
                            hit = false;
                        }
                    }
                }
                if (hit) {
                    return rpn.zone;
                }
            }
            return "";
        }
    }
    
}
