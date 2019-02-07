interface IPlugin {
    //Use a property setter to verify version, etc.
    builder?: MinecraftAddonBuilder;

    sourceTasks?: ITask[];
    installBehaviorTasks?: ITask[];
    installResourceTasks?: ITask[];
    createMCPackTasks?: ITask[];
    createMCAddOnTasks?: ITask[];
    addDefaultTasks?: (gulpTasks: any) => void;
}

interface IPack {
    path: string;
    relativePath: string;
    name: string;
    uuid: string;
    version: [number, number, number];
    types: ["behavior" | "resources"];
}

interface ITask {
    condition: string | RegExp;
    preventDefault?: boolean;
    task: () => NodeJS.ReadWriteStream
}

declare class MinecraftAddonBuilder {
    addPlugin(plugin: IPlugin);
    getTasks(selector: (plugin: IPlugin) => ITask[]);

    /**
     * Identifies packs in a location
     * @param path the directory path you want to check for packs
     * @param callback a callback that will have the packs located as a parameter
     */
    determinePacksInLocation(path: string, callback: ((packs: IPack[]) => any)): void;

    /**
     * Runs an action over every pack that has been identified.
     * @param type optional, either "resources" or "behavior". defaults to both.
     * @param action  the action to perform.
     * @param done  a callback to denote when the operations are complete.
     */
    foreachPack(type?: string, action: (pack: IPack, callback: () => void) => any, done: () => void);

    /**
     * Takes a list of tasks and converts them to gulp tasks for execution
     * @param selector selects the list of ITask to chose from
     * @returns {NodeJS.ReadWriteStream[]}
     */
    getTasks(selector: (plugin: IPlugin) => ITask[] | null): NodeJS.ReadWriteStream[];

    /**
     * returns a default set of gulp tasks that perform the usual actions for a minecraft add-on
     */
    configureEverythingForMe(): Any;
}