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

        static PLUGIN_NAME = "<PLUGIN_NAME_PLACEHOLDER>";
        static PLUGIN_VERSION = "<PLUGIN_VERSION_PLACEHOLDER>";

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
            // for lint
        }
        supportsControl(fieldType: string): boolean {
            return false;
        }
        createControl(ctrlObj: JQuery, settings: IBaseControlOptions) {
            /* should never be called */
        }

        getFieldConfigOptions():IFieldDescription[] {
            return [];
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
             return [
               
            ];
        }
        getCustomerSettingPages(): ISettingPage[] {
           
            return [
               
            ];
        }

        getProjectPages(): IProjectPageParam[] {
            const pages: IProjectPageParam[] = [];
            pages.push({
                id: "RISK_MATRIX",
                title: "risk distribution matrices",
                folder: "DASHBOARDS",
                order: 7000,
                icon: "fa fa-cog",
                usesFilters: true,
                render: (_options: IPluginPanelOptions) => {
                    const gd = new RiskGraphPage();
                    gd.renderProjectPage();
                }
            });
            pages.push({
                id: "RISK_STATS",
                title: "risk distribution stats",
                folder: "DASHBOARDS",
                order: 7000,
                icon: "fa fa-cog",
                usesFilters: true,
                render: (_options: IPluginPanelOptions) => {
                    const gd = new RiskCountsPage();
                    gd.renderProjectPage();
                }
            });
            return pages;
        }
    }
}

// Register the plugin
$(function () {
    plugins.register(new UiPluginRiskMatrix.Plugin());
});

