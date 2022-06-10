// eslint-disable-next-line no-unused-vars
namespace BoilerPlate {
    export class DashboardPage {
        settings: IProjectSettings;

        constructor() {
            this.settings = { ...Plugin.defaultProjectSettings, ...IC.getSettingJSON(Plugin.settingName, {}) } ;
        }

        getDashboardDOM(): JQuery {
            return $(`
        <div class="panel-body-v-scroll fillHeight"> 
            <div class="panel-body">
                This is my content : ${this.settings.content}
            </div>
        </div>
        `);
        }

        renderProjectPage() {

            const control = this.getDashboardDOM();
            app.itemForm.append(
                ml.UI.getPageTitle(
                    this.settings.content,
                    () => {
                        return control;
                    },
                    () => {
                        this.onResize();
                    }
                )
            );
            app.itemForm.append(control);
        }

        onResize() {
            console.log("onresize has been triggered... ");
        }
    }
}
