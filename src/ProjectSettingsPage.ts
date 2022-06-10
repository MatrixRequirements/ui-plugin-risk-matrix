// eslint-disable-next-line no-unused-vars
namespace BoilerPlate {
    /* project Setting page closure*/
    export function ProjectSettingsPage():IPluginSettingPage <IProjectSettings>{
        let self: IPluginSettingPage<IProjectSettings> = {};

        if (window["ConfigPage"] !== undefined) {
            self = { ... Object.getPrototypeOf( new ConfigPage()) }
        }

        
        self.serverSettings = { ...Plugin.defaultServerSettings, ...configApp.getServerSetting(Plugin.settingName, {}) };
        self.renderSettingPage = () => {
            self.initPage(
                `${ Plugin.PLUGIN_NAME } - Project settings` ,
                true,
                undefined,
                "My help",
                "https://docs23.matrixreq.com",
                undefined
            );
            self.showSimple();
        };
        self.saveAsync = ()=> {
            return configApp.setProjectSettingAsync(self.getProject(), Plugin.settingName, JSON.stringify(self.settingsChanged), configApp.getCurrentItemId());
        }
        self.getProject = () => {
            return configApp.getCurrentItemId().split("-")[0];
        }
        self.showAdvanced = () => {
            console.debug("Show advanced clicked");
            self.showAdvancedCode(JSON.stringify(self.settingsChanged), function (newCode: string) {
                self.settingsChanged = JSON.parse(newCode);
                self.paramChanged();
                self.renderSettingPage();
            });
        };
        self.showSimple = () => {

            const settings = IC.getSettingJSON(Plugin.settingName, {});
            self.settingsOriginal = { ...Plugin.defaultProjectSettings, ...settings };
            if (!self.settingsChanged)
                self.settingsChanged = { ...Plugin.defaultProjectSettings, ...settings };
            app.itemForm.append(self.getSettingsDOM(self.settingsChanged));
            
        };

        self.paramChanged = () => {
            configApp.itemChanged(JSON.stringify(self.settingsOriginal) != JSON.stringify(self.settingsChanged));
        }

        self.getSettingsDOM = (settings:IProjectSettings): JQuery => {
            
            return $(`
                <div class="panel-body-v-scroll fillHeight">
                    This is my content : ${settings.content}
                </div>
                `);
        };
        return self;
    }
}
