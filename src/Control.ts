// eslint-disable-next-line no-unused-vars
namespace BoilerPlate{

   export class  Control extends BaseControl {
    
        private settings: IControlOptions;
        private lastValueChanged:number;
        private _editor:JQuery;
        private doesRequireContent = false;
       private defaultValue = "no value yet"
       

       
        constructor( control:JQuery) {
            super(control);
        } 
        
        init(  options:IControlOptions) {
            const defaultOptions:IControlOptions = {
                placeholder: "matrix-ui-plugin-boilerplate",
                controlState: ControlState.FormView, // read only rendering
                canEdit: false, // whether data can be edited 
                dummyData: false, // fill control with a dumy text (for form design...)
                valueChanged: () => console.debug("Value has changed"), // callback to call if value changes
                parameter: {
                    readonly: false, // can be set to overwrite the default readonly status
                    allowResize: true, // allow to resize control
                    hideFullscreen:false //  hide fullscreen
                }
            };
            this.settings = <IControlOptions> ml.JSON.mergeOptions(defaultOptions, options);
            // have default values
            if (!this.settings.fieldValue && this.settings.parameter.initialContent && !this.settings.item ) {
                this.settings.fieldValue =  this.settings.parameter.initialContent;
            }
            if (typeof this.settings.fieldValue === 'undefined' || this.settings.fieldValue === "") {
                this.settings.fieldValue = this.defaultValue;
            }
            //For print        
            if (this.settings.controlState === ControlState.Print || this.settings.controlState === ControlState.Tooltip) {
                this._root.append(super.createHelp(this.settings));
                this._root.append(`<pre>${this.settings.fieldValue}></pre>`);
                return;
            }
    
            if (options.parameter && options.parameter.requiresContent) {
                this.doesRequireContent = options.parameter.requiresContent;
            }
            const helpLine = super.createHelp(this.settings);
            this._root.append(helpLine);
            const ctrlContainer = $("<div>").addClass("baseControl");
            
            this._root.append(ctrlContainer);
            this._editor = this.createEditorFromDOM();
          
            ctrlContainer.append(this._editor);
            
            this._editor.val(this.settings.fieldValue);
    
            // remove mouseout to avoid frequent changes change
            this._editor.change( ()=> {
                clearTimeout(this.lastValueChanged);
                console.log(`${Plugin.fieldType} has changed`)
                this.lastValueChanged = window.setTimeout((noCallBack?:boolean) => this.valueChanged(noCallBack), 333);
            });
            this._editor.on('blur',  () => {
                if (this.settings.focusLeft) {
                    this.settings.focusLeft();
                }
                
            });
            const rt = this._editor.val();
            this._root.data("original", rt);
            this._root.data("new", rt);
        }
        
        // public interface 
        hasChanged():boolean {
            // make sure no changes are pending
            clearTimeout(this.lastValueChanged);
            // this will take and text from the editor and put it int he variable  _root.data("new")
            // but it will not recursively trigger a change
            this.valueChanged(true);
            // now compare
            return  this._root.data("original") !== this._root.data("new");
        }
        
        getValue():string {
            // make sure no changes are pending
            clearTimeout(this.lastValueChanged);
            this.valueChanged(true);
            const text = this._root.data("new");
            return DOMPurify.sanitize(text);
        }
    
        requiresContent() {
            return this.doesRequireContent;
        }
       test(first,second)
       {
           console.log(first, second);
       }
       refresh() {
           console.log("Refresh has been called");
        }
        setValue(newValue:string, reset?:boolean) {
            if (this._editor) {
                this._editor.val(newValue);
            }
    
            this._root.data("new", newValue);
            if (reset) {
                this._root.data("original", newValue);
            }
        }
    
        destroy () {
            if ( this._editor ) {
                this._editor.off();
                this._editor = null;
            }
        }
        
       resizeItem() {
           console.log("resizeItem has been called");
        }
        
        //  private functions
        private valueChanged(noCallback?:boolean) {
            if (this._editor) {
                this._root.data("new", this._editor.val());
            }
            if (this.settings.valueChanged && !noCallback ) { 
                // removed cause the event should be sent also sent if something changes back to normal ... && this._root.data("new")!=this._root.data("original")) {
                this.settings.valueChanged.apply(null);
            }
        }
    
    
        createEditorFromDOM(): JQuery {
            return $(`<div>
                        <pre>${JSON.stringify(this.settings)}</pre>
                    <div> `);
        }
    
    
    }

}