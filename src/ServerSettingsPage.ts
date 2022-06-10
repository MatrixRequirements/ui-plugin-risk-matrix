// eslint-disable-next-line no-unused-vars
namespace BoilerPlate {
    /* server Setting page closure*/
    export function ServerSettingsPage(): IPluginSettingPage<IServerSettings> {
        
        let self: IPluginSettingPage<IServerSettings> = {};
        if (window["ConfigPage"] !== undefined) {
            self = { ...Object.getPrototypeOf(new ConfigPage()) };
        }
        self.serverSettings = { ...Plugin.defaultServerSettings, ...configApp.getServerSetting(Plugin.settingName, {}) };
        
        self.renderSettingPage = () => {
         
            self.initPage(
                `${Plugin.PLUGIN_NAME} - Server setting`,
                true,
                undefined,
                "My help",
                "https://docs23.matrixreq.com",
                undefined
            );
            self.showSimple();
        };

        self.showAdvanced = () => {
            console.debug("Show advanced clicked");
            self.showAdvancedCode(JSON.stringify(self.settingsChanged), function (newCode: string) {
                self.settingsChanged = JSON.parse(newCode);
    
                self.paramChanged();
                self.renderSettingPage();
            });
        };
        self.showSimple = () => {

            self.settingsOriginal = { ...Plugin.defaultServerSettings, ...self.serverSettings };
            if (!self.settingsChanged)
                 self.settingsChanged = { ...Plugin.defaultServerSettings, ...self.serverSettings };
            app.itemForm.append(self.getSettingsDOM( self.settingsChanged));
        };
        
        self.saveAsync = () => {
            return configApp.setServerSettingAsync( Plugin.settingName, JSON.stringify(self.settingsChanged));
        }

        self.paramChanged = () => {
            configApp.itemChanged(JSON.stringify(self.settingsOriginal) != JSON.stringify(self.settingsChanged));
        }
      
        self.getSettingsDOM = (settings:IServerSettings): JQuery => {
            return $(`
                <div class="panel-body-v-scroll fillHeight">
                    <div>
                        This is my customer settings page : ${settings.content}
                    </div>

                </div>
            `);
        };
        return self;
    }
}
