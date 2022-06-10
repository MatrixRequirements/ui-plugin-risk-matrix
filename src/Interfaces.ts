/* Setting interfaces */
// eslint-disable-next-line no-unused-vars
namespace BoilerPlate {
    export interface IProjectSettings {
        /** Setting page placeholder */
        content: string;
    }

    export interface IServerSettings {
        /** Server Setting placeholder */
        content: string;
    }
    export interface IPluginBoilerPlateFieldParameter extends IFieldParameter {
        /** field parameter placeholder*/
        fieldParameter: string;
    }
    export interface IPluginSettingPage<T> {
        renderSettingPage?: () => void,
        showAdvanced?: () => void,
        showSimple?: () => void,
        getSettingsDOM?: (_setting?:T) => JQuery,
        serverSettings?: IServerSettings,
        saveAsync?: () => JQueryDeferred<unknown>,
        paramChanged?:()=>void,
        settingsOriginal?: T,
        settingsChanged?:T,
        getProject?: () => string,
        pageId?:string,
        initPage?: (_title: string, _showAdvancedBtn: boolean, _showDeleteText: string, _help: string, _externalHelp?: string, _showCopy?: boolean) => void
        showAdvancedCode?:(_code:string, _success:(_code:string) => void, _semanticValidate?:IValidationSpec) =>void
  
     }
    export interface IControlOptions extends IBaseControlOptions{
        placeholder:string
    }
}
