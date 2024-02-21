import {IAvEngine} from "../../IAvEngine.js";
import {AvScanResult} from "../../../utils/typeings.js";
import {Constant, Injectable, ProviderScope} from "@tsed/di";
import GlobalEnv from "../../../model/constants/GlobalEnv.js";
import path from "path";
import {filesDir} from "../../../utils/Utils.js";
import {promisify} from "util";
import {exec} from "child_process";
import {AV_ENGINE} from "../../../model/di/tokens.js";

@Injectable({
    scope: ProviderScope.SINGLETON,
    type: AV_ENGINE
})
export class ClamAvEngine implements IAvEngine {

    @Constant(GlobalEnv.CLAM_PATH)
    private clamPath: string | undefined;

    public get enabled(): boolean {
        return !!this.clamPath;
    }

    public async scan(resource: string): Promise<AvScanResult> {
        const toScan = path.resolve(`${filesDir}/${resource}`);
        const execPromise = promisify(exec);
        try {
            await execPromise(`"${this.clamPath}/clamdscan" ${toScan}`);
        } catch (e) {
            return {
                errorCode: e.code,
                passed: false,
                additionalMessage: e.message
            };
        }
        return {
            passed: true
        };
    }

}