/// <reference path="api/Matrix.Labels.ts" />

// Version : <PLUGIN_VERSION_PLACEHOLDER>
// Use a namespace to isolate your plugin code
// This avoids conflicts with other plugins

// eslint-disable-next-line no-unused-vars
namespace BoilerPlate {
    
    export class Plugin implements IPlugin {
        public isDefault = true;
        currentFolder: IItem;
        popupModeOrControl: boolean;
        public static fieldType = "matrix-ui-plugin-boilerplate";

        static PLUGIN_NAME = "<PLUGIN_NAME_PLACEHOLDER>";
        static PLUGIN_VERSION = "<PLUGIN_VERSION_PLACEHOLDER>";
    
    
        static settingName = "matrix-ui-plugin-boilerplate_settings";

        static defaultProjectSettings: IProjectSettings = {
            content: "content for matrix-ui-plugin-boilerplate",
        }; 


        static defaultServerSettings: IServerSettings = {
            content: "content for matrix-ui-plugin-boilerplate",
        };

        constructor() {
            console.debug(`Contructing ${Plugin.PLUGIN_NAME}`);
            
        }

        initItem(_item: IItem, _jui: JQuery) {
            if (_item.id.indexOf("F-") == 0) {
                this.currentFolder = _item;
                this.popupModeOrControl = true;
            } else {
                this.currentFolder = undefined;
                this.popupModeOrControl = false;
            }
        }
        static canBeDisplay(_cat: string): boolean {
            return true;
        }

        updateMenu(ul: JQuery, _hook: number) {
            const li = $(`<li>matrix-ui-plugin-boilerplate</li>`).on("click",() => {
                alert("Plugin matrix-ui-plugin-boilerplate");
            });

            ul.append(li);
        }
        supportsControl(fieldType: string): boolean {
            return fieldType == Plugin.fieldType;
        }
        createControl(ctrlObj: JQuery, settings: IBaseControlOptions) {
            if (settings && settings.fieldType == Plugin.fieldType) {
                const baseControl = new Control(ctrlObj);
                ctrlObj.getController = () => { return baseControl; }
                baseControl.init(<IControlOptions> settings);
            }
        }

        getFieldConfigOptions():IFieldDescription[] {
            return [{id:Plugin.fieldType, capabilities:{canBePublished:false,canBeReadonly:true,canBeXtcPreset:false,canHideInDoc:false,canBeUsedInDocs:false,canRequireContent:true}, class:"",help:"",label:Plugin.PLUGIN_NAME }];
        }
        isEnabled() {
            return true;
        }
        getPluginName() {
            return Plugin.PLUGIN_NAME;
        }

        getPluginVersion() {
            return Plugin.PLUGIN_VERSION;
        }
        getProjectSettingPages(): ISettingPage[] {
            const pbpi = ProjectSettingsPage();
            return [
                {
                    id: "BPP_customerSettings",
                    title: "matrix-ui-plugin-boilerplate plugin project settings page",
                    render: (_ui: JQuery) => {
                        pbpi.renderSettingPage();
                    },
                    saveAsync: () => {
                        return pbpi.saveAsync()
                    }
                },
            ];
        }
        getCustomerSettingPages(): ISettingPage[] {
            const pbpi = ServerSettingsPage();

            return [
                {
                    id: "BPP_ProjectSettings",
                    title: "matrix-ui-plugin-boilerplate  customer settings page",
                    render: (_ui: JQuery) => {
                        pbpi.renderSettingPage();
                    },
                    saveAsync: () => {
                        return pbpi.saveAsync()
                    }
                },
            ];
        }

        getProjectPages(): IProjectPageParam[] {
            const pages: IProjectPageParam[] = [];
            pages.push({
                id: "BPP",
                title: "matrix-ui-plugin-boilerplate  dashboard",
                folder: "DASHBOARDS",
                order: 7000,
                icon: "fa fa-cog",
                usesFilters: true,
                render: (_options: IPluginPanelOptions) => {
                    const gd = new DashboardPage();
                    gd.renderProjectPage();
                },
            });
            return pages;
        }
    }
}

// Register the plugin
$(function () {
    plugins.register(new BoilerPlate.Plugin());
});

