/// <reference path="api/Matrix.Labels.ts" />

// Version : <PLUGIN_VERSION_PLACEHOLDER>
// Use a namespace to isolate your plugin code
// This avoids conflicts with other plugins

// eslint-disable-next-line no-unused-vars
namespace UiPluginRiskMatrix {
    
    export class Plugin implements IPlugin {
        public isDefault = true;
        currentFolder: IItem;
        popupModeOrControl: boolean;
        public static fieldType = "ui_plugin_risk_matrix";

        static PLUGIN_NAME = "<PLUGIN_NAME_PLACEHOLDER>";
        static PLUGIN_VERSION = "<PLUGIN_VERSION_PLACEHOLDER>";
    
    
        static settingName = "ui_plugin_risk_matrix_settings";

        static defaultProjectSettings: IProjectSettings = {
            content: "defaultProjectSettings for ui_plugin_risk_matrix",
        }; 


        static defaultServerSettings: IServerSettings = {
            content: "defaultServerSettings for ui_plugin_risk_matrix",
        };

        constructor() {
            console.debug(`Constructing ${Plugin.PLUGIN_NAME}`);
            
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
            const li = $(`<li>ui_plugin_risk_matrix</li>`).on("click",() => {
                alert("Plugin ui_plugin_risk_matrix");
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
                    id: "UPRM_customerSettings",
                    title: "ui_plugin_risk_matrix plugin project settings page",
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
                    id: "UPRM_ProjectSettings",
                    title: "ui_plugin_risk_matrix  customer settings page",
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
                id: "RISK_TABLE",
                title: "ui_plugin_risk_matrix  dashboard",
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
    plugins.register(new UiPluginRiskMatrix.Plugin());
});

